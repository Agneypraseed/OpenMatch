"""
Agent 2: CV/Resume Analyzer

Extracts a structured professional profile from raw CV text.
Identifies skills both explicitly listed and implied from experience descriptions.
"""
from app.schemas.cv import CVProfile
from app.services.ai_provider import AIProviderConfig, create_structured_model


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


def analyze_cv(cv_text: str, ai_config: AIProviderConfig) -> CVProfile:
    """
    Parse raw CV text into a structured professional profile.

    Args:
        cv_text: The full text extracted from a CV/resume PDF.

    Returns:
        CVProfile with all extracted professional information.
    """
    structured_llm = create_structured_model(ai_config, CVProfile)

    result = structured_llm.invoke(
        f"{SYSTEM_PROMPT}\n\n--- CANDIDATE CV ---\n\n{cv_text}"
    )

    return result
