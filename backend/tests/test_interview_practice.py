import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.practice import AnswerFeedback, LanguageNote, ReviewAnswer
from app.services.interview_practice import delivery_metrics


class InterviewPracticeTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_local_start_respects_style_count_and_topic(self):
        for style in ("mixed", "technical", "behavioral"):
            result = self.client.post("/api/interview/start", json={
                "role": "Engineer", "topic": "Python", "style": style, "question_count": 8,
            })
            self.assertEqual(result.status_code, 200)
            questions = result.json()["questions"]
            self.assertEqual(len({q["question"] for q in questions}), 8)
            if style == "technical":
                self.assertTrue(all("Python" in q["question"] for q in questions))
            if style != "mixed":
                self.assertTrue(all(q["category"] == style for q in questions))

    def test_report_question_seeds_and_bounded_request(self):
        result = self.client.post("/api/interview/start", json={
            "role": "Engineer", "prepared_questions": ["Explain the design of your API."], "question_count": 3,
        })
        self.assertEqual(result.json()["questions"][0]["question"], "Explain the design of your API.")
        for invalid in ({"role": " "}, {"role": "Engineer", "question_count": 500}, {"role": "Engineer", "context": "x" * 6001}):
            self.assertEqual(self.client.post("/api/interview/start", json=invalid).status_code, 422)

    def test_no_speaking_pace_for_typed_or_edited_answers(self):
        request = ReviewAnswer(role="Engineer", question="What did you build?", answer="one two three four", spoken_seconds=2)
        self.assertIsNone(delivery_metrics(request).words_per_minute)
        request.input_mode = "spoken"
        self.assertEqual(delivery_metrics(request).words_per_minute, 120)
        self.assertEqual(delivery_metrics(request).pace, "steady")

    def test_answer_has_grammar_feedback_and_nonrepeating_followup(self):
        data = {"role": "Engineer", "question": "What did you build?", "answer": "Um, I has an idea. I built a service and reduced latency by 20 percent."}
        first = self.client.post("/api/interview/answer", json=data).json()
        self.assertEqual(first["metrics"]["filler_count"], 1)
        self.assertEqual(first["feedback"]["language_notes"][0]["improved"], "I have")
        data["question"] = first["feedback"]["follow_up"]
        second = self.client.post("/api/interview/answer", json=data).json()
        self.assertNotEqual(first["feedback"]["follow_up"], second["feedback"]["follow_up"])

    def test_blank_and_oversized_answers_rejected(self):
        for answer in ("   ", "x" * 12001):
            result = self.client.post("/api/interview/answer", json={"role": "Engineer", "question": "What did you build?", "answer": answer})
            self.assertEqual(result.status_code, 422)

    def test_provider_failure_is_explicit_and_does_not_leak_key(self):
        with patch("app.services.interview_practice.create_structured_model", side_effect=RuntimeError("secret-key")):
            result = self.client.post("/api/interview/start", json={"role": "Engineer", "provider": "openai", "api_key": "secret-key"})
        self.assertEqual(result.status_code, 502)
        self.assertNotIn("secret-key", result.text)

    def test_ai_request_excludes_key_and_filters_invented_quotes(self):
        model = MagicMock()
        model.invoke.return_value = AnswerFeedback(summary="Specific example.", strengths=["Explained an action."], improvements=["Explain the result."], follow_up="How did you measure success?", language_notes=[LanguageNote(original="invented phrase", improved="rewrite", explanation="test")])
        with patch("app.services.interview_practice.create_structured_model", return_value=model):
            response = self.client.post("/api/interview/answer", json={"role": "Engineer", "provider": "openai", "api_key": "secret-key", "question": "What did you build?", "answer": "I built an API."})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["feedback"]["language_notes"], [])
        self.assertNotIn("secret-key", str(model.invoke.call_args))


if __name__ == "__main__":
    unittest.main()
