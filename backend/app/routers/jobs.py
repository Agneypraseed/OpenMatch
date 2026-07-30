"""Job-description source endpoints."""
from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, HttpUrl

from app.services.job_source import JobSourceError, extract_job_description_from_url


router = APIRouter(prefix="/api/jobs", tags=["jobs"])


class JobSourceRequest(BaseModel):
    url: HttpUrl


@router.post("/extract")
async def extract_job_source(payload: JobSourceRequest):
    try:
        return await run_in_threadpool(
            extract_job_description_from_url,
            str(payload.url),
        )
    except JobSourceError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
