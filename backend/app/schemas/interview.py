"""
Pydantic schemas for interview preparation.

These models define the output of Agent 5 (Interview Coach),
providing role-specific interview questions and suggested answers.
"""
from pydantic import BaseModel, Field
from typing import Literal


class InterviewQuestion(BaseModel):
    """A single interview question with suggested answer."""

    question: str = Field(description="The interview question")
    category: Literal["behavioral", "technical", "situational"] = Field(
        description="The type of interview question"
    )
    why_asked: str = Field(
        description="Why an interviewer would ask this question for this role"
    )
    suggested_answer: str = Field(
        description="A suggested answer using the STAR method, incorporating the candidate's actual experience from their CV"
    )
    tips: list[str] = Field(
        default_factory=list,
        description="Additional tips for answering this question well",
    )


class InterviewPreparation(BaseModel):
    """Complete interview preparation package. Output of Agent 5."""

    role_summary: str = Field(
        description="Brief summary of what to expect in interviews for this role"
    )
    questions: list[InterviewQuestion] = Field(
        description="6-8 likely interview questions with suggested answers"
    )
    general_tips: list[str] = Field(
        description="General interview tips specific to this role and industry"
    )
    topics_to_study: list[str] = Field(
        description="Technical topics the candidate should review before the interview"
    )


# --- Full Analysis Response ---


class AnalysisResponse(BaseModel):
    """Complete analysis response combining all agent outputs."""

    # Metadata
    job_title: str
    match_score: float

    # Agent outputs (serialized)
    gap_analysis: dict
    resume_optimization: dict
    interview_preparation: dict

    # Evaluation
    processing_time_seconds: float
    agents_used: list[str]
