"""
Pydantic schemas for structured job description parsing.

These models define the exact structure that Agent 1 (Job Parser) will output,
ensuring consistent, typed data flows through the rest of the pipeline.
"""
from pydantic import BaseModel, Field
from typing import Literal


class SkillRequirement(BaseModel):
    """A single skill extracted from a job description."""

    skill: str = Field(description="The skill name, e.g. 'Python', 'Machine Learning'")
    level: Literal["required", "preferred", "nice_to_have"] = Field(
        description="How critical this skill is for the role"
    )
    category: Literal["technical", "soft", "domain", "tool"] = Field(
        description="Classification of the skill type"
    )


class JobRequirements(BaseModel):
    """Structured representation of a job posting, extracted by Agent 1."""

    title: str = Field(description="The job title")
    company: str | None = Field(default=None, description="Company name if mentioned")
    seniority_level: str | None = Field(
        default=None,
        description="Seniority level: Junior, Mid, Senior, Lead, Staff, Principal",
    )
    required_skills: list[SkillRequirement] = Field(
        description="All skills mentioned in the job posting, categorized by importance"
    )
    responsibilities: list[str] = Field(
        description="Key responsibilities and duties listed in the posting"
    )
    qualifications: list[str] = Field(
        description="Required and preferred qualifications"
    )
    experience_years: int | None = Field(
        default=None, description="Minimum years of experience required"
    )
    education_level: str | None = Field(
        default=None,
        description="Required education level, e.g. 'Bachelor's in CS', 'Master's in AI'",
    )
    industry: str | None = Field(
        default=None, description="Industry or domain of the role"
    )
    key_technologies: list[str] = Field(
        default_factory=list,
        description="Specific technologies, frameworks, and tools mentioned",
    )
