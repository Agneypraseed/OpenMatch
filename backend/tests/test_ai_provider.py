import sys
import types
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.services.ai_provider import (
    AIProviderConfig,
    AIProviderConfigurationError,
    create_chat_model,
    resolve_ai_provider,
)


class AIProviderTests(unittest.TestCase):
    def test_local_provider_never_requires_or_uses_a_key(self):
        with (
            patch.object(settings, "GOOGLE_API_KEY", "configured-google-key"),
            patch.object(settings, "OPENAI_API_KEY", "configured-openai-key"),
        ):
            self.assertIsNone(resolve_ai_provider("local", None, None))

    def test_openai_request_key_is_scoped_to_the_resolved_request(self):
        with patch.object(settings, "OPENAI_API_KEY", ""):
            config = resolve_ai_provider(
                "openai",
                "sk-request-only",
                "gpt-5.6-terra",
            )
            self.assertEqual(settings.OPENAI_API_KEY, "")

        self.assertEqual(config.provider, "openai")
        self.assertEqual(config.api_key, "sk-request-only")
        self.assertEqual(config.chat_model, "gpt-5.6-terra")

    def test_openai_provider_requires_a_key(self):
        with patch.object(settings, "OPENAI_API_KEY", ""):
            with self.assertRaises(AIProviderConfigurationError):
                resolve_ai_provider("openai", "", "gpt-5.6-sol")

    def test_astra_chat_model_uses_responses_api_with_supported_reasoning(self):
        chat_openai = MagicMock()
        fake_module = types.ModuleType("langchain_openai")
        fake_module.ChatOpenAI = chat_openai
        config = AIProviderConfig(
            provider="openai",
            api_key="sk-test",
            chat_model="gpt-6-astra",
            embedding_model="text-embedding-3-small",
        )

        with patch.dict(sys.modules, {"langchain_openai": fake_module}):
            create_chat_model(config)

        chat_openai.assert_called_once_with(
            model="gpt-6-astra",
            api_key="sk-test",
            use_responses_api=True,
            reasoning_effort="low",
            max_retries=2,
        )

    def test_api_rejects_openai_without_a_key(self):
        client = TestClient(app)
        with (
            patch(
                "app.routers.analysis.extract_text_from_pdf",
                return_value="Alex Doe\nPython developer with FastAPI experience.",
            ),
            patch.object(settings, "OPENAI_API_KEY", ""),
        ):
            response = client.post(
                "/api/analyze",
                files={"cv_file": ("resume.pdf", b"%PDF", "application/pdf")},
                data={
                    "job_description": (
                        "Job Title: Backend Engineer. Python, FastAPI, PostgreSQL, "
                        "Docker, and REST API experience are required."
                    ),
                    "analysis_provider": "openai",
                    "model": "gpt-5.6-sol",
                },
            )

        self.assertEqual(response.status_code, 400)
        self.assertIn("API key", response.json()["detail"])

    def test_non_reasoning_custom_model_omits_reasoning_and_honors_output_limit(self):
        chat_openai = MagicMock()
        fake_module = types.ModuleType("langchain_openai")
        fake_module.ChatOpenAI = chat_openai
        config = AIProviderConfig("openai", "sk-test", "gpt-4.1-mini", "text-embedding-3-small")
        with patch.dict(sys.modules, {"langchain_openai": fake_module}):
            create_chat_model(config, max_output_tokens=3000)
        self.assertNotIn("reasoning_effort", chat_openai.call_args.kwargs)
        self.assertEqual(chat_openai.call_args.kwargs["max_tokens"], 3000)


if __name__ == "__main__":
    unittest.main()
