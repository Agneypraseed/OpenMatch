import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.services.email_delivery import EmailDeliveryError


class RecruiterAnalysisTests(unittest.TestCase):
    def test_ranks_candidates_and_drafts_feedback(self):
        resumes = {
            b"candidate-one": (
                "Taylor Kim\nPython Engineer\n"
                "Built Python FastAPI APIs with PostgreSQL and Docker.\n"
                "taylor@example.com"
            ),
            b"candidate-two": (
                "Jordan Lee\nFrontend Developer\n"
                "Built React applications with JavaScript."
            ),
        }

        def extract(payload):
            return resumes[payload]

        client = TestClient(app)
        with patch("app.routers.recruiter.extract_text_from_pdf", side_effect=extract):
            response = client.post(
                "/api/recruiter/analyze",
                files=[
                    ("cv_files", ("taylor.pdf", b"candidate-one", "application/pdf")),
                    ("cv_files", ("jordan.pdf", b"candidate-two", "application/pdf")),
                ],
                data={
                    "job_description": (
                        "Job Title: Backend Engineer\n"
                        "Python, FastAPI, PostgreSQL, Docker, and REST APIs are required."
                    ),
                    "shortlist_count": "1",
                },
            )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["analyzed_count"], 2)
        self.assertEqual(body["candidates"][0]["candidate_name"], "Taylor Kim")
        self.assertEqual(body["candidates"][0]["decision"], "shortlisted")
        self.assertEqual(body["candidates"][1]["decision"], "not_shortlisted")
        self.assertTrue(
            body["candidates"][1]["feedback_email"]["requires_human_review"]
        )
        self.assertEqual(
            body["email_delivery"]["status"],
            "configuration_required",
        )
        self.assertFalse(body["email_delivery"]["configured"])

    def test_feedback_send_requires_explicit_approval(self):
        client = TestClient(app)
        response = client.post(
            "/api/recruiter/feedback/send",
            json={
                "recipient": "candidate@example.com",
                "subject": "Application feedback",
                "body": "This is a reviewed and sufficiently detailed feedback message.",
                "approved": False,
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("approve", response.json()["detail"].lower())

    def test_feedback_send_is_disabled_without_configuration(self):
        client = TestClient(app)
        with patch(
            "app.routers.recruiter.email_delivery_configured",
            return_value=False,
        ):
            response = client.post(
                "/api/recruiter/feedback/send",
                json={
                    "recipient": "candidate@example.com",
                    "subject": "Application feedback",
                    "body": "This is a reviewed and sufficiently detailed feedback message.",
                    "approved": True,
                },
            )

        self.assertEqual(response.status_code, 503)
        self.assertIn("not configured", response.json()["detail"].lower())

    def test_feedback_send_returns_delivery_receipt(self):
        client = TestClient(app)
        receipt = {
            "status": "sent",
            "provider": "smtp",
            "message_id": "<test@openmatch.local>",
            "sent_at": "2026-07-30T18:00:00+00:00",
        }
        with (
            patch(
                "app.routers.recruiter.email_delivery_configured",
                return_value=True,
            ),
            patch(
                "app.routers.recruiter.send_feedback_email",
                return_value=receipt,
            ) as send,
        ):
            response = client.post(
                "/api/recruiter/feedback/send",
                json={
                    "recipient": "candidate@example.com",
                    "subject": "Application feedback",
                    "body": "This is a reviewed and sufficiently detailed feedback message.",
                    "approved": True,
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), receipt)
        send.assert_called_once_with(
            "candidate@example.com",
            "Application feedback",
            "This is a reviewed and sufficiently detailed feedback message.",
        )

    def test_feedback_provider_failure_is_safe(self):
        client = TestClient(app)
        with (
            patch(
                "app.routers.recruiter.email_delivery_configured",
                return_value=True,
            ),
            patch(
                "app.routers.recruiter.send_feedback_email",
                side_effect=EmailDeliveryError(
                    "The configured email provider could not deliver this message."
                ),
            ),
        ):
            response = client.post(
                "/api/recruiter/feedback/send",
                json={
                    "recipient": "candidate@example.com",
                    "subject": "Application feedback",
                    "body": "This is a reviewed and sufficiently detailed feedback message.",
                    "approved": True,
                },
            )

        self.assertEqual(response.status_code, 502)
        self.assertNotIn("password", response.json()["detail"].lower())


if __name__ == "__main__":
    unittest.main()
