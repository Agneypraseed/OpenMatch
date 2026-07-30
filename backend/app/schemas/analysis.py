"""
Pydantic schemas for gap analysis results.

These models define the output of Agent 3 (Gap Analyst) and Agent 4 (Resume Optimizer),
providing structured, actionable insights about the CV-to-job alignment.
"""
from pydantic import BaseModel, Field
from typing import Literal


class SkillMatch(BaseModel):
    """Assessment of how well a single required skill matches the candidate's CV."""

    skill: str = Field(description="The skill being evaluated")
    status: Literal["strong_match", "partial_match", "missing"] = Field(
        description="How well the candidate's CV matches this skill requirement"
    )
    evidence: str = Field(
        description="Specific evidence from the CV supporting this assessment, or explanation of why the skill is missing"
    )
    priority: Literal["critical", "important", "nice_to_have"] = Field(
        description="How important this skill gap is to address"
    )


class ExperienceAssessment(BaseModel):
    """Assessment of the candidate's experience alignment."""

    meets_requirements: bool = Field(
        description="Whether the candidate meets the experience requirements"
    )
    assessment: str = Field(
        description="Detailed assessment of experience alignment"
    )
    strengths: list[str] = Field(
        description="Experience areas where the candidate is strong"
    )
    gaps: list[str] = Field(
        description="Experience areas where the candidate falls short"
    )


class GapAnalysis(BaseModel):
    """Complete gap analysis comparing a CV against job requirements. Output of Agent 3."""

    match_score: float = Field(
        description="Overall match percentage from 0 to 100",
        ge=0,
        le=100,
    )
    matching_skills: list[SkillMatch] = Field(
        description="Skills where the candidate has a strong or partial match"
    )
    missing_skills: list[SkillMatch] = Field(
        description="Skills that are missing from the candidate's profile"
    )
    experience_assessment: ExperienceAssessment = Field(
        description="Assessment of the candidate's experience alignment"
    )
    education_assessment: str = Field(
        description="Assessment of whether education requirements are met"
    )
    overall_verdict: str = Field(
        description="A concise 2-3 sentence verdict on the candidate's fit for the role"
    )
    top_priorities: list[str] = Field(
        description="Top 3-5 actions the candidate should take to improve their application"
    )


# --- Resume Optimizer Schemas (Agent 4) ---


class BulletImprovement(BaseModel):
    """A single resume bullet point improvement suggestion."""

    original: str = Field(description="The original bullet point from the CV")
    improved: str = Field(
        description="The improved version tailored to the target job"
    )
    rationale: str = Field(
        description="Why this change was made and how it helps"
    )


class KeywordSuggestion(BaseModel):
    """A keyword that should be added to the resume."""

    keyword: str = Field(description="The keyword or phrase to add")
    where_to_add: str = Field(
        description="Which section of the resume to add it to"
    )
    context: str = Field(
        description="How to naturally incorporate this keyword"
    )


class ResumeOptimization(BaseModel):
    """Complete resume optimization suggestions. Output of Agent 4."""

    tailored_summary: str = Field(
        description="A new professional summary tailored to the target job"
    )
    bullet_improvements: list[BulletImprovement] = Field(
        description="Specific bullet point improvements for experience entries"
    )
    keyword_suggestions: list[KeywordSuggestion] = Field(
        description="Keywords to add for ATS optimization"
    )
    new_bullet_points: list[str] = Field(
        description="Brand new bullet points the candidate could add based on their experience"
    )
    formatting_tips: list[str] = Field(
        description="Tips for resume structure and formatting"
    )
