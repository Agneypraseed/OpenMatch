"""Provider-neutral configuration for OpenMatch's optional AI pipeline."""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Type

from pydantic import BaseModel

from app.config import settings


SUPPORTED_PROVIDERS = {"local", "gemini", "openai", "auto"}
MODEL_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$")


class AIProviderConfigurationError(ValueError):
    """Raised when a requested AI provider cannot be configured safely."""


@dataclass(frozen=True)
class AIProviderConfig:
    provider: str
    api_key: str
    chat_model: str
    embedding_model: str


def resolve_ai_provider(
    requested_provider: str | None,
    request_api_key: str | None,
    requested_model: str | None,
) -> AIProviderConfig | None:
    """Resolve one request without mutating environment variables or storing keys."""
    provider = (requested_provider or "auto").strip().lower()
    if provider not in SUPPORTED_PROVIDERS:
        raise AIProviderConfigurationError(
            "Provider must be one of: local, gemini, openai, auto."
        )

    if provider == "local":
        return None

    if provider == "auto":
        if settings.ANALYSIS_MODE == "local":
            return None
        if settings.GOOGLE_API_KEY:
            provider = "gemini"
        elif settings.OPENAI_API_KEY:
            provider = "openai"
        elif settings.ANALYSIS_MODE == "ai":
            raise AIProviderConfigurationError(
                "AI mode requires GOOGLE_API_KEY or OPENAI_API_KEY."
            )
        else:
            return None

    api_key = (request_api_key or "").strip()
    if not api_key:
        api_key = (
            settings.GOOGLE_API_KEY
            if provider == "gemini"
            else settings.OPENAI_API_KEY
        )
    if not api_key:
        label = "Google Gemini" if provider == "gemini" else "OpenAI"
        raise AIProviderConfigurationError(
            f"{label} requires an API key. Enter it in Model API settings."
        )
    if len(api_key) > 512:
        raise AIProviderConfigurationError("The API key is unexpectedly long.")

    default_model = (
        settings.GEMINI_LLM_MODEL
        if provider == "gemini"
        else settings.OPENAI_LLM_MODEL
    )
    chat_model = (requested_model or default_model).strip()
    if not MODEL_PATTERN.fullmatch(chat_model):
        raise AIProviderConfigurationError(
            "The model ID contains unsupported characters."
        )

    embedding_model = (
        settings.GEMINI_EMBEDDING_MODEL
        if provider == "gemini"
        else settings.OPENAI_EMBEDDING_MODEL
    )
    return AIProviderConfig(
        provider=provider,
        api_key=api_key,
        chat_model=chat_model,
        embedding_model=embedding_model,
    )


def create_chat_model(
    config: AIProviderConfig,
    *,
    temperature: float | None = None,
    max_output_tokens: int | None = None,
) -> Any:
    if config.provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        kwargs: dict[str, Any] = {
            "model": config.chat_model,
            "google_api_key": config.api_key,
            "temperature": settings.TEMPERATURE if temperature is None else temperature,
        }
        if max_output_tokens is not None:
            kwargs["max_output_tokens"] = max_output_tokens
        return ChatGoogleGenerativeAI(**kwargs)

    if config.provider == "openai":
        try:
            from langchain_openai import ChatOpenAI
        except ImportError as exc:
            raise AIProviderConfigurationError(
                "OpenAI support is not installed. Install backend requirements."
            ) from exc

        kwargs = {
            "model": config.chat_model,
            "api_key": config.api_key,
            "use_responses_api": True,
            "max_retries": 2,
        }
        if config.chat_model.startswith(("gpt-5", "gpt-6", "o3", "o4")):
            kwargs["reasoning_effort"] = "low"
        if max_output_tokens is not None:
            kwargs["max_tokens"] = max_output_tokens
        return ChatOpenAI(**kwargs)

    raise AIProviderConfigurationError(
        f"Unsupported AI provider: {config.provider}."
    )


def create_structured_model(
    config: AIProviderConfig,
    schema: Type[BaseModel],
    *,
    temperature: float | None = None,
    max_output_tokens: int | None = None,
) -> Any:
    llm = create_chat_model(
        config,
        temperature=temperature,
        max_output_tokens=max_output_tokens,
    )
    if config.provider == "openai":
        return llm.with_structured_output(schema, method="json_schema")
    return llm.with_structured_output(schema)


def create_embeddings(config: AIProviderConfig) -> Any:
    if config.provider == "gemini":
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        return GoogleGenerativeAIEmbeddings(
            model=config.embedding_model,
            google_api_key=config.api_key,
        )

    if config.provider == "openai":
        try:
            from langchain_openai import OpenAIEmbeddings
        except ImportError as exc:
            raise AIProviderConfigurationError(
                "OpenAI support is not installed. Install backend requirements."
            ) from exc

        return OpenAIEmbeddings(
            model=config.embedding_model,
            api_key=config.api_key,
        )

    raise AIProviderConfigurationError(
        f"Unsupported AI provider: {config.provider}."
    )
