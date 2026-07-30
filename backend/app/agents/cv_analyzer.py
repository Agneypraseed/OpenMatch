"""
Agent 2: CV/Resume Analyzer

Extracts a structured professional profile from raw CV text.
Identifies skills both explicitly listed and implied from experience descriptions.
"""
from langchain_google_genai import ChatGoogleGenerativeAI
from app.schemas.cv import CVProfile
from app.config import settings


SYSTEM_PROMPT = """You are an expert resume/CV analyst. Your task is to carefully parse a 
candidate's CV and extract their complete professional profile into a structured format.

Rules:
- Extract ALL skills, including those implied by work experience (e.g., if they 
  "built REST APIs with Spring Boot", extract both "REST APIs" and "Spring Boot").
- For experience entries, capture actual responsibilities and achievements, 
  not just job titles.
- Estimate total_years_experience by calculating from work experience dates.
- For the summary field, write a concise 2-3 sentence professional summary 
  based on what you see in the CV.
- Be thorough — missing skills means the gap analysis will undercount matches.
- Include certifications, projects, and any other relevant qualifications.
"""


def analyze_cv(cv_text: str) -> CVProfile:
    """
    Parse raw CV text into a structured professional profile.

    Args:
        cv_text: The full text extracted from a CV/resume PDF.

    Returns:
        CVProfile with all extracted professional information.
    """
    llm = ChatGoogleGenerativeAI(
        model=settings.LLM_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=settings.TEMPERATURE,
    )

    structured_llm = llm.with_structured_output(CVProfile)

    result = structured_llm.invoke(
        f"{SYSTEM_PROMPT}\n\n--- CANDIDATE CV ---\n\n{cv_text}"
    )

    return result
