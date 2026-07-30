"""Matchline API for evidence-based applicant and recruiter workflows."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import analysis, health, jobs, recruiter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

app = FastAPI(
    title="Matchline",
    description="Evidence-based resume comparison and transparent candidate feedback",
    version="0.2.0",
)

# CORS — allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(analysis.router)
app.include_router(jobs.router)
app.include_router(recruiter.router)


@app.get("/")
async def root():
    """API root — basic info."""
    return {
        "name": "Matchline",
        "version": "0.2.0",
        "docs": "/docs",
        "health": "/health",
    }
