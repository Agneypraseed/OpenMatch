"""
Analysis router — the main API endpoint.

Orchestrates the full multi-agent pipeline:
  1. Job Parser → structured job requirements
  2. CV Analyzer → structured CV profile
  3. RAG → embed CV, retrieve relevant context
  4. Gap Analyst → compare CV vs job with RAG context
  5. Resume Optimizer → generate improvements
  6. Interview Coach → generate Q&A prep
"""
import time
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.rag.document_processor import extract_text_from_pdf, chunk_document
from app.rag.vector_store import create_vector_store, retrieve_context_for_skills
from app.agents.job_parser import parse_job_description
from app.agents.cv_analyzer import analyze_cv
from app.agents.gap_analyst import analyze_gaps
from app.agents.resume_optimizer import optimize_resume
from app.agents.interview_coach import prepare_interview
from app.evaluation.metrics import evaluate_analysis_quality, calculate_retrieval_score
from app.config import settings
from app.services.local_analyzer import analyze_locally

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["analysis"])
MAX_CV_SIZE = 10 * 1024 * 1024


@router.post("/analyze")
async def analyze_application(
    cv_file: UploadFile = File(..., description="CV/Resume PDF file"),
    job_description: str = Form(..., description="Job description text"),
):
    """
    Run the full multi-agent analysis pipeline.

    Accepts a CV PDF and job description text, then runs 5 specialized agents
    to produce a comprehensive analysis with gap assessment, resume suggestions,
    and interview preparation.
    """
    start_time = time.time()
    agents_used = []
    cv_text = ""

    try:
        # --- Step 1: Extract CV text from PDF ---
        logger.info("Step 1: Extracting text from CV PDF...")

        if not cv_file.filename or not cv_file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are supported. Please upload a PDF.",
            )
        if len(job_description.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="The job description must contain at least 50 characters.",
            )

        cv_bytes = await cv_file.read(MAX_CV_SIZE + 1)
        if len(cv_bytes) > MAX_CV_SIZE:
            raise HTTPException(
                status_code=413,
                detail="The PDF is too large. The maximum file size is 10 MB.",
            )

        try:
            cv_text = extract_text_from_pdf(cv_bytes)
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is not a readable PDF.",
            ) from exc
        if not cv_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the PDF. Please ensure it's not image-only.",
            )

        if settings.ANALYSIS_MODE not in {"auto", "ai", "local"}:
            raise HTTPException(
                status_code=500,
                detail="ANALYSIS_MODE must be one of: auto, ai, local.",
            )

        if settings.ANALYSIS_MODE == "local" or (
            settings.ANALYSIS_MODE == "auto" and not settings.GOOGLE_API_KEY
        ):
            logger.info("Using zero-configuration local MVP analysis.")
            return analyze_locally(cv_text, job_description, start_time)

        if not settings.GOOGLE_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="AI mode requires GOOGLE_API_KEY. Set ANALYSIS_MODE=local to run without it.",
            )

        # --- Step 2: Agent 1 — Parse Job Description ---
        logger.info("Step 2: Agent 1 - Parsing job description...")
        job_requirements = parse_job_description(job_description)
        agents_used.append("job_parser")

        # --- Step 3: Agent 2 — Analyze CV ---
        logger.info("Step 3: Agent 2 - Analyzing CV...")
        cv_profile = analyze_cv(cv_text)
        agents_used.append("cv_analyzer")

        # --- Step 4: RAG — Embed CV and retrieve context ---
        logger.info("Step 4: Building RAG index and retrieving context...")
        cv_chunks = chunk_document(cv_text, source="cv")
        vector_store = create_vector_store(cv_chunks)

        # Retrieve relevant CV sections for each required skill
        skill_names = [s.skill for s in job_requirements.required_skills]
        rag_context = retrieve_context_for_skills(vector_store, skill_names)

        # Calculate retrieval quality
        retrieved_texts = [chunk.page_content for chunk in cv_chunks]
        retrieval_score = calculate_retrieval_score(retrieved_texts, skill_names)

        # --- Step 5: Agent 3 — Gap Analysis ---
        logger.info("Step 5: Agent 3 - Performing gap analysis...")
        gap_analysis = analyze_gaps(job_requirements, cv_profile, rag_context)
        agents_used.append("gap_analyst")

        # --- Step 6: Agent 4 — Resume Optimization ---
        logger.info("Step 6: Agent 4 - Generating resume optimizations...")
        resume_optimization = optimize_resume(
            job_requirements, cv_profile, gap_analysis
        )
        agents_used.append("resume_optimizer")

        # --- Step 7: Agent 5 — Interview Preparation ---
        logger.info("Step 7: Agent 5 - Preparing interview materials...")
        interview_prep = prepare_interview(
            job_requirements, cv_profile, gap_analysis
        )
        agents_used.append("interview_coach")

        # --- Step 8: Evaluate output quality ---
        logger.info("Step 8: Evaluating output quality...")
        try:
            quality_score = evaluate_analysis_quality(
                job_description=job_description,
                gap_analysis_summary=gap_analysis.overall_verdict,
                resume_suggestions_summary=resume_optimization.tailored_summary,
            )
            quality_data = quality_score.model_dump()
        except Exception as e:
            logger.warning(f"Quality evaluation failed (non-critical): {e}")
            quality_data = None

        processing_time = time.time() - start_time
        logger.info(f"Pipeline complete in {processing_time:.1f}s")

        return {
            "job_title": job_requirements.title,
            "match_score": gap_analysis.match_score,
            "job_requirements": job_requirements.model_dump(),
            "cv_profile": cv_profile.model_dump(),
            "gap_analysis": gap_analysis.model_dump(),
            "resume_optimization": resume_optimization.model_dump(),
            "interview_preparation": interview_prep.model_dump(),
            "evaluation": {
                "quality_score": quality_data,
                "retrieval_coverage": retrieval_score,
            },
            "metadata": {
                "processing_time_seconds": round(processing_time, 2),
                "agents_used": agents_used,
                "cv_chunks_created": len(cv_chunks),
                "skills_analyzed": len(skill_names),
                "analysis_mode": "ai",
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Pipeline error: {e}", exc_info=True)
        if settings.ANALYSIS_MODE == "auto" and cv_text:
            logger.warning("AI pipeline unavailable; returning local MVP analysis.")
            result = analyze_locally(cv_text, job_description, start_time)
            result["metadata"]["fallback_reason"] = "The AI service was unavailable."
            return result
        raise HTTPException(
            status_code=500,
            detail="AI analysis failed. Check the backend logs and API configuration.",
        )
