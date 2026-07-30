"""
Gemini embedding setup for the RAG pipeline.

Uses Google's text-embedding-004 model for creating vector representations
of CV chunks and job requirement queries.
"""
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.config import settings


def get_embeddings() -> GoogleGenerativeAIEmbeddings:
    """
    Create and return a configured Gemini embedding model instance.

    Returns:
        GoogleGenerativeAIEmbeddings configured with the project's API key.
    """
    return GoogleGenerativeAIEmbeddings(
        model=settings.EMBEDDING_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
    )
