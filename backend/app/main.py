"""
AI-Powered Job Application Assistant — FastAPI Backend

Multi-agent RAG application that analyzes job descriptions against
a candidate's CV to identify skill gaps, suggest resume improvements,
and prepare interview materials.
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import analysis, health

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

app = FastAPI(
    title="AI Job Application Assistant",
    description="Multi-agent RAG system for CV-to-job alignment analysis",
    version="1.0.0",
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


@app.get("/")
async def root():
    """API root — basic info."""
    return {
        "name": "AI Job Application Assistant",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }
