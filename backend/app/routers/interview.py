"""Stateless mock interview endpoints; transcripts and API keys are not stored."""
import asyncio

from fastapi import APIRouter, HTTPException
from starlette.concurrency import run_in_threadpool

from app.schemas.practice import AnswerReviewed, PracticeStarted, ReviewAnswer, StartPractice
from app.services.ai_provider import AIProviderConfigurationError
from app.services.interview_practice import review_answer, start_practice

router = APIRouter(prefix="/api/interview", tags=["interview"])


async def run_coach(function, request):
    try:
        return await asyncio.wait_for(run_in_threadpool(function, request), timeout=50)
    except AIProviderConfigurationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail="The coach took too long. Your answer is still here; try again.") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="The AI coach is unavailable. Check your model and API key, or start a local practice session.") from exc


@router.post("/start", response_model=PracticeStarted)
async def start(request: StartPractice):
    return await run_coach(start_practice, request)


@router.post("/answer", response_model=AnswerReviewed)
async def answer(request: ReviewAnswer):
    return await run_coach(review_answer, request)
