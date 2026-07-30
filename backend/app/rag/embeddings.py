"""Provider-neutral embedding setup for the in-memory RAG pipeline."""
from typing import Any

from app.services.ai_provider import AIProviderConfig, create_embeddings


def get_embeddings(ai_config: AIProviderConfig) -> Any:
    """
    Create and return a configured Gemini embedding model instance.

    Returns:
        GoogleGenerativeAIEmbeddings configured with the project's API key.
    """
    return create_embeddings(ai_config)
