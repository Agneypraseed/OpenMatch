"""
Agent 5: Interview Coach

Generates role-specific interview questions and suggested answers
based on the gap analysis and the candidate's actual experience.
Answers follow the STAR method using the candidate's real experience.
"""
from app.schemas.job import JobRequirements
from app.schemas.cv import CVProfile
from app.schemas.analysis import GapAnalysis
from app.schemas.interview import InterviewPreparation
from app.config import settings
from app.services.ai_provider import AIProviderConfig, create_structured_model


SYSTEM_PROMPT = """You are an expert interview coach preparing a candidate for a 
specific job interview. Your task is to generate likely interview questions and 
help the candidate prepare strong answers.

You have access to:
1. The target job requirements.
2. The candidate's CV profile with their actual experience.
3. The gap analysis showing strengths and weaknesses.

Rules:
- Generate 6-8 questions covering behavioral, technical, and situational types.
- For behavioral questions, focus on gaps and areas where the candidate needs to 
  demonstrate transferable experience.
- For technical questions, focus on the key technologies in the job description.
- For situational questions, create scenarios relevant to the role's responsibilities.
- In suggested_answer: use the STAR method (Situation, Task, Action, Result) and 
  reference the candidate's ACTUAL experience from their CV. Don't make up stories.
- For skill gaps, suggest how the candidate can honestly address the gap 
  while highlighting related experience.
- topics_to_study should be specific, not generic (e.g., "Review FAISS indexing 
  strategies" not just "Study machine learning").
"""


def prepare_interview(
    job_requirements: JobRequirements,
    cv_profile: CVProfile,
    gap_analysis: GapAnalysis,
    ai_config: AIProviderConfig,
) -> InterviewPreparation:
    """
    Generate interview preparation materials tailored to the role and candidate.

    Args:
        job_requirements: Structured job requirements from Agent 1.
        cv_profile: Structured CV profile from Agent 2.
        gap_analysis: Gap analysis results from Agent 3.

    Returns:
        InterviewPreparation with questions, answers, and study topics.
    """
    structured_llm = create_structured_model(
        ai_config,
        InterviewPreparation,
        temperature=0.5,
        max_output_tokens=settings.MAX_TOKENS,
    )

    prompt = f"""{SYSTEM_PROMPT}

--- TARGET ROLE ---
Title: {job_requirements.title}
Company: {job_requirements.company or 'Not specified'}
Seniority: {job_requirements.seniority_level or 'Not specified'}
Industry: {job_requirements.industry or 'Not specified'}

Key Responsibilities:
{chr(10).join(f'- {r}' for r in job_requirements.responsibilities)}

--- CANDIDATE PROFILE ---
Name: {cv_profile.name}
Current Title: {cv_profile.current_title or 'Not specified'}
Years of Experience: {cv_profile.total_years_experience}

Experience:
{_format_experience_brief(cv_profile)}

Projects:
{_format_projects(cv_profile)}

--- GAP ANALYSIS ---
Match Score: {gap_analysis.match_score}%

Strengths (matching skills):
{chr(10).join(f'- {s.skill}: {s.evidence}' for s in gap_analysis.matching_skills[:5])}

Weaknesses (missing skills):
{chr(10).join(f'- {s.skill}: {s.evidence}' for s in gap_analysis.missing_skills[:5])}

Top Priorities:
{chr(10).join(f'- {p}' for p in gap_analysis.top_priorities)}
"""

    result = structured_llm.invoke(prompt)
    return result


def _format_experience_brief(cv: CVProfile) -> str:
    """Format experience entries briefly for the interview coach."""
    entries = []
    for exp in cv.experience:
        top_responsibilities = exp.responsibilities[:3]
        bullets = ", ".join(top_responsibilities)
        entries.append(f"- {exp.job_title} at {exp.company} ({exp.duration}): {bullets}")
    return "\n".join(entries)


def _format_projects(cv: CVProfile) -> str:
    """Format project entries for the interview coach."""
    if not cv.projects:
        return "No projects listed."
    entries = []
    for proj in cv.projects:
        tech = f" [{', '.join(proj.technologies)}]" if proj.technologies else ""
        entries.append(f"- {proj.name}{tech}: {proj.description}")
    return "\n".join(entries)
