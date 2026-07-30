import unittest
from unittest.mock import MagicMock, patch

from app.config import settings
from app.services.email_delivery import (
    email_delivery_configured,
    send_feedback_email,
)


class EmailDeliveryTests(unittest.TestCase):
    def test_requires_a_complete_consistent_configuration(self):
        with (
            patch.object(settings, "EMAIL_DELIVERY_ENABLED", True),
            patch.object(settings, "SMTP_HOST", "smtp.example.com"),
            patch.object(settings, "SMTP_FROM_EMAIL", "hiring@example.com"),
            patch.object(settings, "SMTP_USERNAME", "mailer"),
            patch.object(settings, "SMTP_PASSWORD", ""),
            patch.object(settings, "SMTP_SECURITY", "starttls"),
        ):
            self.assertFalse(email_delivery_configured())

    def test_sends_reviewed_message_through_starttls(self):
        server = MagicMock()
        smtp_context = MagicMock()
        smtp_context.__enter__.return_value = server

        with (
            patch.object(settings, "EMAIL_DELIVERY_ENABLED", True),
            patch.object(settings, "SMTP_HOST", "smtp.example.com"),
            patch.object(settings, "SMTP_PORT", 587),
            patch.object(settings, "SMTP_FROM_EMAIL", "hiring@example.com"),
            patch.object(settings, "SMTP_FROM_NAME", "OpenMatch team"),
            patch.object(settings, "SMTP_USERNAME", "mailer"),
            patch.object(settings, "SMTP_PASSWORD", "secret"),
            patch.object(settings, "SMTP_SECURITY", "starttls"),
            patch.object(settings, "SMTP_TIMEOUT_SECONDS", 10),
            patch(
                "app.services.email_delivery.smtplib.SMTP",
                return_value=smtp_context,
            ) as smtp,
        ):
            receipt = send_feedback_email(
                "candidate@example.com",
                "Application feedback",
                "Thank you for applying. Here is the reviewed feedback.",
            )

        smtp.assert_called_once_with("smtp.example.com", 587, timeout=10)
        server.starttls.assert_called_once()
        server.login.assert_called_once_with("mailer", "secret")
        server.send_message.assert_called_once()
        sent_message = server.send_message.call_args.args[0]
        self.assertEqual(sent_message["To"], "candidate@example.com")
        self.assertEqual(receipt["status"], "sent")


if __name__ == "__main__":
    unittest.main()
