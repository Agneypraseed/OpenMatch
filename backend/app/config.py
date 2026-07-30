"""
AI-Powered Job Application Assistant — Backend Configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    # auto uses Gemini when configured and the deterministic MVP engine otherwise.
    ANALYSIS_MODE: str = os.getenv("ANALYSIS_MODE", "auto").lower()

    # Gemini model configuration
    LLM_MODEL: str = "gemini-2.5-flash"
    EMBEDDING_MODEL: str = "models/text-embedding-004"

    # RAG configuration
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 100
    RETRIEVAL_K: int = 5

    # LLM generation settings
    TEMPERATURE: float = 0.3  # Low for structured extraction
    MAX_TOKENS: int = 4096

    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")


settings = Settings()
