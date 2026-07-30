"""
Agent 1: Job Description Parser

Extracts structured job requirements from raw job description text.
Uses Gemini's structured output capability to produce a reliable
JobRequirements Pydantic model.
"""
from langchain_google_genai import ChatGoogleGenerativeAI
from app.schemas.job import JobRequirements
from app.config import settings


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


def parse_job_description(job_description: str) -> JobRequirements:
    """
    Parse a raw job description into structured requirements.

    Args:
        job_description: The raw text of a job posting.

    Returns:
        JobRequirements with all extracted skills, qualifications, etc.
    """
    llm = ChatGoogleGenerativeAI(
        model=settings.LLM_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=settings.TEMPERATURE,
    )

    structured_llm = llm.with_structured_output(JobRequirements)

    result = structured_llm.invoke(
        f"{SYSTEM_PROMPT}\n\n--- JOB DESCRIPTION ---\n\n{job_description}"
    )

    return result
