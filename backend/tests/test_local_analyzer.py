import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.services.local_analyzer import analyze_locally


CV_TEXT = """Alex Doe
Senior Python Developer
5 years of experience
- Built FastAPI REST APIs with PostgreSQL and Docker.
- Led Agile delivery on AWS.
Bachelor's degree
"""

JOB_DESCRIPTION = """Job Title: Senior Backend Engineer
We require 4 years of experience with Python, FastAPI, PostgreSQL, Docker,
Kubernetes, and communication skills. AWS is preferred.
"""


class LocalAnalyzerTests(unittest.TestCase):
    def test_returns_complete_local_analysis(self):
        result = analyze_locally(CV_TEXT, JOB_DESCRIPTION)

        self.assertEqual(result["job_title"], "Senior Backend Engineer")
        self.assertEqual(result["metadata"]["analysis_mode"], "local")
        self.assertGreater(result["match_score"], 50)
        self.assertIn("gap_analysis", result)
        self.assertIn("resume_optimization", result)
        self.assertIn("interview_preparation", result)

        statuses = {
            item["skill"]: item["status"]
            for item in result["gap_analysis"]["matching_skills"]
        }
        self.assertEqual(statuses["Python"], "strong_match")
        self.assertEqual(statuses["Kubernetes"], "partial_match")

    def test_api_uses_local_mode_without_key(self):
        client = TestClient(app)
        with (
            patch("app.routers.analysis.extract_text_from_pdf", return_value=CV_TEXT),
            patch("app.routers.analysis.settings.GOOGLE_API_KEY", ""),
            patch("app.routers.analysis.settings.ANALYSIS_MODE", "auto"),
        ):
            response = client.post(
                "/api/analyze",
                files={"cv_file": ("resume.pdf", b"%PDF", "application/pdf")},
                data={"job_description": JOB_DESCRIPTION},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["metadata"]["analysis_mode"], "local")

    def test_api_rejects_short_job_description(self):
        client = TestClient(app)
        response = client.post(
            "/api/analyze",
            files={"cv_file": ("resume.pdf", b"%PDF", "application/pdf")},
            data={"job_description": "Too short"},
        )

        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
