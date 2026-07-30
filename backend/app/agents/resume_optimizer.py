"""
Agent 4: Resume Optimizer

Generates tailored resume improvements based on the gap analysis results.
Provides specific before/after bullet point rewrites, keyword suggestions,
and a tailored professional summary.
"""
from app.schemas.job import JobRequirements
from app.schemas.cv import CVProfile
from app.schemas.analysis import GapAnalysis, ResumeOptimization
from app.config import settings
from app.services.ai_provider import AIProviderConfig, create_structured_model


SYSTEM_PROMPT = """You are an expert resume writer and career coach. Your task is to 
generate specific, actionable resume improvements to help a candidate better align 
their CV with a target job.

You have access to:
1. The gap analysis showing where the candidate matches and falls short.
2. The candidate's current CV profile.
3. The target job requirements.

Rules:
- For bullet_improvements: take ACTUAL bullet points from the candidate's experience 
  and rewrite them to better highlight relevant skills for the target job.
- Don't fabricate experience. Only rephrase and emphasize existing experience.
- For keyword_suggestions: identify ATS (Applicant Tracking System) keywords from the 
  job description that should appear in the resume.
- The tailored_summary should be 2-3 sentences, professional, and directly address 
  the job's key requirements using the candidate's strengths.
- For new_bullet_points: suggest NEW bullet points the candidate could add based on 
  their existing experience that they might not have thought to include.
- Be specific, not generic. Every suggestion should reference the actual job and CV.
"""


def optimize_resume(
    job_requirements: JobRequirements,
    cv_profile: CVProfile,
    gap_analysis: GapAnalysis,
    ai_config: AIProviderConfig,
) -> ResumeOptimization:
    """
    Generate tailored resume improvement suggestions.

    Args:
        job_requirements: Structured job requirements from Agent 1.
        cv_profile: Structured CV profile from Agent 2.
        gap_analysis: Gap analysis results from Agent 3.

    Returns:
        ResumeOptimization with specific, actionable improvements.
    """
    structured_llm = create_structured_model(
        ai_config,
        ResumeOptimization,
        temperature=0.5,
        max_output_tokens=settings.MAX_TOKENS,
    )

    prompt = f"""{SYSTEM_PROMPT}

--- TARGET JOB ---
Title: {job_requirements.title}
Company: {job_requirements.company or 'Not specified'}
Key Technologies: {', '.join(job_requirements.key_technologies)}

--- CANDIDATE'S CURRENT EXPERIENCE ---
{_format_experience(cv_profile)}

--- GAP ANALYSIS RESULTS ---
Match Score: {gap_analysis.match_score}%

Missing Skills:
{chr(10).join(f'- {s.skill} ({s.priority})' for s in gap_analysis.missing_skills)}

Matching Skills:
{chr(10).join(f'- {s.skill}: {s.status}' for s in gap_analysis.matching_skills)}

Top Priorities:
{chr(10).join(f'- {p}' for p in gap_analysis.top_priorities)}

Overall Verdict: {gap_analysis.overall_verdict}
"""

    result = structured_llm.invoke(prompt)
    return result


def _format_experience(cv: CVProfile) -> str:
    """Format experience entries with bullet points for the optimizer."""
    sections = []
    for exp in cv.experience:
        bullets = "\n".join(f"  • {r}" for r in exp.responsibilities)
        tech = f"  Technologies: {', '.join(exp.technologies)}" if exp.technologies else ""
        sections.append(
            f"{exp.job_title} at {exp.company} ({exp.duration})\n{bullets}\n{tech}"
        )
    return "\n\n".join(sections)
