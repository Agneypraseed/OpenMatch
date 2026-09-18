"""
AI-Powered Job Application Assistant — Backend Configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


class Settings:
    """Application settings loaded from environment variables."""

    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    # auto uses Gemini when configured and the deterministic MVP engine otherwise.
    ANALYSIS_MODE: str = os.getenv("ANALYSIS_MODE", "auto").lower()

    # Optional AI provider configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_LLM_MODEL: str = os.getenv("OPENAI_LLM_MODEL", "gpt-6-astra")
    OPENAI_EMBEDDING_MODEL: str = os.getenv(
        "OPENAI_EMBEDDING_MODEL",
        "text-embedding-3-small",
    )
    GEMINI_LLM_MODEL: str = os.getenv("GEMINI_LLM_MODEL", "gemini-2.5-flash")
    GEMINI_EMBEDDING_MODEL: str = os.getenv(
        "GEMINI_EMBEDDING_MODEL",
        "models/text-embedding-004",
    )

    # RAG configuration
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 100
    RETRIEVAL_K: int = 5

    # LLM generation settings
    TEMPERATURE: float = 0.3  # Low for structured extraction
    MAX_TOKENS: int = 4096

    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Recruiter feedback delivery. Disabled until a sender and SMTP host exist.
    EMAIL_DELIVERY_ENABLED: bool = os.getenv(
        "EMAIL_DELIVERY_ENABLED",
        "false",
    ).lower() in {"1", "true", "yes"}
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = _env_int("SMTP_PORT", 587)
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "OpenMatch hiring team")
    SMTP_SECURITY: str = os.getenv("SMTP_SECURITY", "starttls").lower()
    SMTP_TIMEOUT_SECONDS: int = _env_int("SMTP_TIMEOUT_SECONDS", 15)


settings = Settings()
