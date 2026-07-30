"""
Agent 3: Gap Analyst

Compares the candidate's CV profile against job requirements to identify
skill gaps, experience alignment, and overall fit. Uses RAG-retrieved
context from the CV vector store to ground assessments in evidence.
"""
from langchain_google_genai import ChatGoogleGenerativeAI
from app.schemas.job import JobRequirements
from app.schemas.cv import CVProfile
from app.schemas.analysis import GapAnalysis
from app.config import settings


SYSTEM_PROMPT = """You are an expert career advisor performing a detailed gap analysis 
between a candidate's CV and a target job's requirements.

You have access to:
1. The structured job requirements (skills, qualifications, responsibilities).
2. The structured CV profile (skills, experience, education).
3. Relevant context retrieved from the CV via semantic search (RAG context).

Your task:
- Compare each required skill against the candidate's profile.
- For "strong_match": the candidate clearly has this skill with demonstrable experience.
- For "partial_match": the candidate has related experience but not exact.
- For "missing": the candidate has no evidence of this skill.
- Provide specific evidence from the CV for each assessment.
- Calculate a realistic match_score (0-100) based on weighted skill importance.
- Required skills missing = heavy penalty. Nice-to-have missing = minor penalty.
- Provide actionable top_priorities the candidate should focus on.

Be honest and constructive. Don't inflate the match score.
"""


def analyze_gaps(
    job_requirements: JobRequirements,
    cv_profile: CVProfile,
    rag_context: str,
) -> GapAnalysis:
    """
    Perform a detailed gap analysis between CV and job requirements.

    Args:
        job_requirements: Structured job requirements from Agent 1.
        cv_profile: Structured CV profile from Agent 2.
        rag_context: Relevant CV sections retrieved via RAG.

    Returns:
        GapAnalysis with per-skill matching, scores, and priorities.
    """
    llm = ChatGoogleGenerativeAI(
        model=settings.LLM_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=settings.TEMPERATURE,
        max_output_tokens=settings.MAX_TOKENS,
    )

    structured_llm = llm.with_structured_output(GapAnalysis)

    # Build the analysis prompt with all context
    prompt = f"""{SYSTEM_PROMPT}

--- JOB REQUIREMENTS ---
Title: {job_requirements.title}
Company: {job_requirements.company or 'Not specified'}
Experience Required: {job_requirements.experience_years or 'Not specified'} years
Education: {job_requirements.education_level or 'Not specified'}

Required Skills:
{_format_skills(job_requirements)}

Responsibilities:
{chr(10).join(f'- {r}' for r in job_requirements.responsibilities)}

--- CANDIDATE PROFILE ---
Name: {cv_profile.name}
Current Title: {cv_profile.current_title or 'Not specified'}
Total Experience: {cv_profile.total_years_experience} years
Skills Listed: {', '.join(cv_profile.skills)}
Certifications: {', '.join(cv_profile.certifications) if cv_profile.certifications else 'None'}

Education:
{_format_education(cv_profile)}

--- RELEVANT CV CONTEXT (from semantic search) ---
{rag_context}
"""

    result = structured_llm.invoke(prompt)
    return result


def _format_skills(job: JobRequirements) -> str:
    """Format job skills into a readable list."""
    lines = []
    for s in job.required_skills:
        lines.append(f"- {s.skill} [{s.level}] ({s.category})")
    return "\n".join(lines)


def _format_education(cv: CVProfile) -> str:
    """Format education entries into a readable list."""
    lines = []
    for e in cv.education:
        gpa_str = f" (GPA: {e.gpa})" if e.gpa else ""
        lines.append(f"- {e.degree} at {e.institution}, {e.year}{gpa_str}")
    return "\n".join(lines)
