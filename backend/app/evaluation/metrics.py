"""
Evaluation metrics for the analysis pipeline.

Uses LLM-as-judge to assess the quality of generated recommendations
and provides quantitative scoring for retrieval quality.
"""
from pydantic import BaseModel, Field
from app.services.ai_provider import AIProviderConfig, create_structured_model


class QualityScore(BaseModel):
    """Quality assessment from LLM-as-judge."""

    relevance_score: float = Field(
        description="How relevant are the recommendations to the job? (0-10)",
        ge=0, le=10,
    )
    specificity_score: float = Field(
        description="How specific (vs generic) are the suggestions? (0-10)",
        ge=0, le=10,
    )
    actionability_score: float = Field(
        description="How actionable are the recommendations? (0-10)",
        ge=0, le=10,
    )
    overall_quality: float = Field(
        description="Overall quality score (0-10)",
        ge=0, le=10,
    )
    reasoning: str = Field(
        description="Brief explanation of the scoring"
    )


def evaluate_analysis_quality(
    job_description: str,
    gap_analysis_summary: str,
    resume_suggestions_summary: str,
    ai_config: AIProviderConfig,
) -> QualityScore:
    """
    Use LLM-as-judge to evaluate the quality of the analysis output.

    Args:
        job_description: Original job description text.
        gap_analysis_summary: Summary of gap analysis results.
        resume_suggestions_summary: Summary of resume optimization suggestions.

    Returns:
        QualityScore with numerical ratings and reasoning.
    """
    structured_llm = create_structured_model(
        ai_config,
        QualityScore,
        temperature=0.1,
    )

    prompt = f"""You are a quality evaluator for an AI career coaching system. 
Evaluate the quality of the following analysis output.

Score each dimension from 0-10:
- relevance_score: Are the recommendations directly relevant to the job?
- specificity_score: Are suggestions specific (not generic advice)?
- actionability_score: Can the candidate immediately act on these suggestions?
- overall_quality: Overall assessment.

--- ORIGINAL JOB DESCRIPTION ---
{job_description[:2000]}

--- GAP ANALYSIS OUTPUT ---
{gap_analysis_summary[:2000]}

--- RESUME SUGGESTIONS ---
{resume_suggestions_summary[:2000]}
"""

    return structured_llm.invoke(prompt)


def calculate_retrieval_score(
    retrieved_contexts: list[str],
    query_skills: list[str],
) -> float:
    """
    Calculate a simple retrieval quality score.

    Checks what percentage of queried skills appear in the retrieved context.

    Args:
        retrieved_contexts: List of text chunks retrieved from the vector store.
        query_skills: List of skills that were searched for.

    Returns:
        Score from 0.0 to 1.0 indicating retrieval coverage.
    """
    if not query_skills:
        return 1.0

    combined_context = " ".join(retrieved_contexts).lower()
    found = sum(
        1 for skill in query_skills
        if skill.lower() in combined_context
    )

    return found / len(query_skills)
