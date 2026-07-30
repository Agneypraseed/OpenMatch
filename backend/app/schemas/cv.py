"""
Pydantic schemas for structured CV/resume parsing.

These models define the exact structure that Agent 2 (CV Analyzer) will output,
capturing the candidate's full professional profile in a structured format.
"""
from pydantic import BaseModel, Field


class ExperienceEntry(BaseModel):
    """A single work experience entry from the CV."""

    job_title: str = Field(description="The job title held")
    company: str = Field(description="The company or organization name")
    duration: str = Field(
        description="Duration in the role, e.g. 'June 2020 - Sept 2022' or '2 years'"
    )
    responsibilities: list[str] = Field(
        description="Key responsibilities and achievements in this role"
    )
    technologies: list[str] = Field(
        default_factory=list,
        description="Technologies, tools, and frameworks used in this role",
    )


class EducationEntry(BaseModel):
    """A single education entry from the CV."""

    degree: str = Field(description="Degree name, e.g. 'M.Sc. in Artificial Intelligence'")
    institution: str = Field(description="University or institution name")
    year: str = Field(description="Graduation year or expected graduation")
    gpa: str | None = Field(default=None, description="GPA if mentioned")
    relevant_coursework: list[str] = Field(
        default_factory=list,
        description="Relevant courses or specializations mentioned",
    )


class ProjectEntry(BaseModel):
    """A single project entry from the CV."""

    name: str = Field(description="Project name or title")
    description: str = Field(description="Brief description of the project")
    technologies: list[str] = Field(
        default_factory=list, description="Technologies used in the project"
    )


class CVProfile(BaseModel):
    """Complete structured profile extracted from a candidate's CV by Agent 2."""

    name: str = Field(description="Candidate's full name")
    current_title: str | None = Field(
        default=None, description="Current or most recent job title"
    )
    skills: list[str] = Field(
        description="All technical and soft skills mentioned or implied in the CV"
    )
    experience: list[ExperienceEntry] = Field(
        description="Work experience entries, ordered from most recent to oldest"
    )
    education: list[EducationEntry] = Field(
        description="Education entries"
    )
    certifications: list[str] = Field(
        default_factory=list,
        description="Professional certifications, e.g. 'AWS Certified Cloud Practitioner'",
    )
    projects: list[ProjectEntry] = Field(
        default_factory=list,
        description="Notable projects mentioned in the CV",
    )
    total_years_experience: float = Field(
        description="Estimated total years of professional experience"
    )
    summary: str = Field(
        description="A brief 2-3 sentence summary of the candidate's overall profile"
    )
