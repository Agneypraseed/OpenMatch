"""Bounded, stateless contracts for mock interview practice."""
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field


class PracticeSettings(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    role: str = Field(min_length=2, max_length=120)
    topic: str = Field(default="", max_length=180)
    provider: Literal["local", "openai", "gemini"] = "local"
    model: str = Field(default="", max_length=100)
    api_key: str = Field(default="", max_length=512, repr=False, exclude=True)


class StartPractice(PracticeSettings):
    style: Literal["mixed", "technical", "behavioral"] = "mixed"
    question_count: Literal[3, 5, 8] = 5
    context: str = Field(default="", max_length=6000)
    prepared_questions: list[Annotated[str, Field(max_length=1200)]] = Field(default_factory=list, max_length=8)


class PracticeQuestion(BaseModel):
    question: str = Field(min_length=10, max_length=1200)
    category: Literal["behavioral", "technical", "situational"]


class QuestionSet(BaseModel):
    questions: list[PracticeQuestion] = Field(min_length=3, max_length=8)


class PreviousAnswer(BaseModel):
    question: str = Field(max_length=1200)
    answer: str = Field(max_length=12000)


class ReviewAnswer(PracticeSettings):
    question: str = Field(min_length=10, max_length=1200)
    answer: str = Field(min_length=2, max_length=12000)
    input_mode: Literal["typed", "spoken"] = "typed"
    spoken_seconds: float | None = Field(default=None, ge=1, le=3600, allow_inf_nan=False)
    history: list[PreviousAnswer] = Field(default_factory=list, max_length=12)


class LanguageNote(BaseModel):
    original: str = Field(max_length=600)
    improved: str = Field(max_length=600)
    explanation: str = Field(max_length=600)


class AnswerFeedback(BaseModel):
    summary: str = Field(max_length=2000)
    strengths: list[str] = Field(max_length=5)
    improvements: list[str] = Field(max_length=5)
    language_notes: list[LanguageNote] = Field(max_length=5)
    follow_up: str = Field(min_length=10, max_length=1200)


class DeliveryMetrics(BaseModel):
    word_count: int
    filler_count: int
    words_per_minute: int | None
    pace: Literal["not_measured", "slow", "steady", "fast"]


class PracticeStarted(QuestionSet):
    mode: Literal["local", "openai", "gemini"]


class AnswerReviewed(BaseModel):
    feedback: AnswerFeedback
    metrics: DeliveryMetrics
    mode: Literal["local", "openai", "gemini"]
    notice: str
