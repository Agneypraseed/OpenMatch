"""
Health check router.
"""
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {"status": "healthy", "service": "job-application-assistant"}
