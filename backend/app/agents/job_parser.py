"""
Agent 1: Job Description Parser

Extracts structured job requirements from raw job description text.
Uses the selected provider's structured output capability to produce a reliable
JobRequirements Pydantic model.
"""
from app.schemas.job import JobRequirements
from app.services.ai_provider import AIProviderConfig, create_structured_model


SYSTEM_PROMPT = """You are an expert job description analyst. Your task is to carefully 
analyze a job posting and extract ALL requirements, skills, and qualifications into a 
structured format.

Rules:
- Extract EVERY skill mentioned, whether explicitly listed or implied in responsibilities.
- Classify each skill's importance: "required" (must-have), "preferred" (should-have), 
  or "nice_to_have" (bonus).
- Classify each skill's category: "technical" (programming, frameworks, ML), 
  "soft" (communication, leadership), "domain" (industry knowledge), 
  or "tool" (specific software/platforms).
- For experience_years, extract the minimum stated requirement. If a range is given, 
  use the lower bound.
- Be thorough — missing a skill means the gap analysis will be incomplete.
"""


def parse_job_description(
    job_description: str,
    ai_config: AIProviderConfig,
) -> JobRequirements:
    """
    Parse a raw job description into structured requirements.

    Args:
        job_description: The raw text of a job posting.

    Returns:
        JobRequirements with all extracted skills, qualifications, etc.
    """
    structured_llm = create_structured_model(ai_config, JobRequirements)

    result = structured_llm.invoke(
        f"{SYSTEM_PROMPT}\n\n--- JOB DESCRIPTION ---\n\n{job_description}"
    )

    return result
