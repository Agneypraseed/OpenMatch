"""Recruiter batch comparison with evidence and reviewable feedback drafts."""
from __future__ import annotations

import re
import time

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field, field_validator
from starlette.concurrency import run_in_threadpool

from app.rag.document_processor import extract_text_from_pdf
from app.routers.analysis import MAX_CV_SIZE
from app.services.email_delivery import (
    EmailDeliveryError,
    EmailDeliveryNotConfigured,
    email_delivery_capabilities,
    email_delivery_configured,
    send_feedback_email,
)
from app.services.local_analyzer import analyze_locally


router = APIRouter(prefix="/api/recruiter", tags=["recruiter"])
MAX_BATCH_SIZE = 50
EMAIL_PATTERN = re.compile(
    r"^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$",
    flags=re.IGNORECASE,
)


class FeedbackEmailRequest(BaseModel):
    recipient: str = Field(min_length=3, max_length=254)
    subject: str = Field(min_length=3, max_length=200)
    body: str = Field(min_length=20, max_length=10_000)
    approved: bool

    @field_validator("recipient")
    @classmethod
    def validate_recipient(cls, value: str) -> str:
        cleaned = value.strip()
        if not EMAIL_PATTERN.fullmatch(cleaned):
            raise ValueError("Enter a valid recipient email address.")
        return cleaned

    @field_validator("subject")
    @classmethod
    def validate_subject(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 3:
            raise ValueError("The subject must contain at least 3 characters.")
        if "\r" in cleaned or "\n" in cleaned:
            raise ValueError("The subject must be a single line.")
        return cleaned

    @field_validator("body")
    @classmethod
    def validate_body(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 20:
            raise ValueError("The message must contain at least 20 characters.")
        return cleaned


@router.post("/analyze")
async def analyze_candidates(
    cv_files: list[UploadFile] = File(..., description="Candidate resume PDFs"),
    job_description: str = Form(...),
    shortlist_count: int = Form(default=3, ge=1, le=50),
):
    started_at = time.time()
    if len(job_description.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="The job description must contain at least 50 characters.",
        )
    if not cv_files:
        raise HTTPException(status_code=400, detail="Upload at least one resume.")
    if len(cv_files) > MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"A batch can contain at most {MAX_BATCH_SIZE} resumes.",
        )

    analyses = []
    for uploaded in cv_files:
        filename = uploaded.filename or "candidate.pdf"
        if not filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail=f"{filename} is not a PDF.",
            )
        payload = await uploaded.read(MAX_CV_SIZE + 1)
        if len(payload) > MAX_CV_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"{filename} is larger than 10 MB.",
            )
        try:
            cv_text = extract_text_from_pdf(payload)
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail=f"{filename} is not a readable PDF.",
            ) from exc
        if not cv_text.strip():
            raise HTTPException(
                status_code=400,
                detail=f"No text could be extracted from {filename}.",
            )

        result = analyze_locally(cv_text, job_description, started_at)
        result["_filename"] = filename
        result["_email"] = _extract_email(cv_text)
        analyses.append(result)

    analyses.sort(
        key=lambda item: (
            item["match_score"],
            len(item["gap_analysis"]["matching_skills"]),
        ),
        reverse=True,
    )
    actual_shortlist = min(shortlist_count, len(analyses))
    candidates = [
        _candidate_result(item, rank, rank <= actual_shortlist)
        for rank, item in enumerate(analyses, start=1)
    ]
    skills_analyzed = max(
        (item["metadata"]["skills_analyzed"] for item in analyses),
        default=0,
    )

    return {
        "job_title": analyses[0]["job_title"] if analyses else "Target role",
        "analyzed_count": len(candidates),
        "shortlist_count": actual_shortlist,
        "candidates": candidates,
        "methodology": {
            "mode": "local_evidence_match",
            "skills_analyzed": skills_analyzed,
            "confidence": (
                "high" if skills_analyzed >= 8
                else "medium" if skills_analyzed >= 4
                else "low"
            ),
            "statement": (
                "Candidates are compared against the same detected requirements. "
                "Every score includes resume evidence and every outcome includes a reason."
            ),
        },
        "email_delivery": email_delivery_capabilities(),
        "processing_time_seconds": round(time.time() - started_at, 2),
    }


@router.get("/feedback/capabilities")
async def feedback_capabilities():
    """Report delivery readiness without exposing SMTP configuration."""
    return email_delivery_capabilities()


@router.post("/feedback/send")
async def send_reviewed_feedback(request: FeedbackEmailRequest):
    """Send one feedback email after an explicit per-message approval."""
    if not request.approved:
        raise HTTPException(
            status_code=400,
            detail="Review and approve the feedback before sending it.",
        )
    if not email_delivery_configured():
        raise HTTPException(
            status_code=503,
            detail=(
                "Email delivery is not configured. Add the SMTP settings and "
                "restart the backend, or copy the draft instead."
            ),
        )

    try:
        return await run_in_threadpool(
            send_feedback_email,
            request.recipient,
            request.subject,
            request.body,
        )
    except EmailDeliveryNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except EmailDeliveryError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


def _candidate_result(result: dict, rank: int, shortlisted: bool) -> dict:
    profile = result["cv_profile"]
    gap = result["gap_analysis"]
    matching = gap["matching_skills"]
    missing = gap["missing_skills"]
    name = profile.get("name") or result["_filename"].rsplit(".", 1)[0]
    strengths = [item["skill"] for item in matching[:5]]
    gaps = [item["skill"] for item in missing[:4]]
    decision = "shortlisted" if shortlisted else "not_shortlisted"
    decision_reason = (
        f"Ranked #{rank} based on evidence for {', '.join(strengths[:3]) or 'transferable experience'}."
        if shortlisted
        else (
            f"Ranked #{rank}. The strongest evidence was in "
            f"{', '.join(strengths[:3]) or 'transferable experience'}, while the role "
            f"still requires clearer evidence for {', '.join(gaps[:3]) or 'key requirements'}."
        )
    )
    return {
        "rank": rank,
        "candidate_name": name,
        "filename": result["_filename"],
        "email": result["_email"],
        "score": result["match_score"],
        "decision": decision,
        "decision_reason": decision_reason,
        "evidence": [
            {
                "requirement": item["skill"],
                "status": item["status"],
                "resume_evidence": item["evidence"],
                "priority": item["priority"],
            }
            for item in matching
        ],
        "gaps": [
            {
                "requirement": item["skill"],
                "reason": item["evidence"],
                "priority": item["priority"],
            }
            for item in missing
        ],
        "feedback_email": _feedback_email(
            name=name,
            job_title=result["job_title"],
            shortlisted=shortlisted,
            strengths=strengths,
            gaps=gaps,
        ),
    }


def _feedback_email(
    name: str,
    job_title: str,
    shortlisted: bool,
    strengths: list[str],
    gaps: list[str],
) -> dict:
    greeting_name = name.split()[0] if name and name != "Candidate" else "there"
    if shortlisted:
        subject = f"Update on your application for {job_title}"
        body = (
            f"Hi {greeting_name},\n\n"
            f"Thank you for applying for the {job_title} role. We found clear evidence "
            f"of alignment in {', '.join(strengths[:3]) or 'your relevant experience'} "
            "and would like to continue the conversation.\n\n"
            "A recruiter will contact you with the next step.\n\nBest,\nHiring team"
        )
    else:
        subject = f"Feedback on your application for {job_title}"
        body = (
            f"Hi {greeting_name},\n\n"
            f"Thank you for applying for the {job_title} role. Your resume showed relevant "
            f"evidence in {', '.join(strengths[:3]) or 'several transferable areas'}. "
            f"For this role, we needed clearer evidence of "
            f"{', '.join(gaps[:3]) or 'the highest-priority requirements'}.\n\n"
            "This decision reflects the evidence available in the submitted resume and "
            "is not a judgment of your overall potential. We hope the specific areas above "
            "make the outcome more understandable and useful.\n\nBest,\nHiring team"
        )
    return {
        "subject": subject,
        "body": body,
        "status": "draft",
        "requires_human_review": True,
    }


def _extract_email(text: str) -> str | None:
    match = re.search(
        r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b",
        text,
        flags=re.IGNORECASE,
    )
    return match.group(0) if match else None
