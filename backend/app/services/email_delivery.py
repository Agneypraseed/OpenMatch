"""Review-gated recruiter feedback delivery over configured SMTP."""
from __future__ import annotations

import logging
import smtplib
import ssl
from datetime import datetime, timezone
from email.message import EmailMessage
from email.utils import formataddr, make_msgid

from app.config import settings


logger = logging.getLogger(__name__)
SUPPORTED_SECURITY = {"starttls", "ssl", "plain"}


class EmailDeliveryNotConfigured(RuntimeError):
    """Raised when feedback delivery is attempted without a mail provider."""


class EmailDeliveryError(RuntimeError):
    """Raised when a configured mail provider cannot deliver a message."""


def email_delivery_configured() -> bool:
    credentials_are_consistent = bool(settings.SMTP_USERNAME) == bool(
        settings.SMTP_PASSWORD
    )
    return bool(
        settings.EMAIL_DELIVERY_ENABLED
        and settings.SMTP_HOST
        and settings.SMTP_FROM_EMAIL
        and credentials_are_consistent
        and settings.SMTP_SECURITY in SUPPORTED_SECURITY
    )


def email_delivery_capabilities() -> dict:
    configured = email_delivery_configured()
    return {
        "configured": configured,
        "provider": "smtp" if configured else None,
        "status": "ready_for_review" if configured else "configuration_required",
        "review_required": True,
        "automatic_sending": False,
        "statement": (
            "A recruiter must review and approve each message before it is sent."
            if configured
            else (
                "Feedback drafts are ready, but email delivery is disabled until "
                "it is explicitly enabled and an SMTP sender is configured."
            )
        ),
    }


def send_feedback_email(recipient: str, subject: str, body: str) -> dict:
    """Send one already-reviewed feedback message.

    This function never selects recipients or constructs rejection decisions. The
    caller must provide the reviewed recipient, subject, and body explicitly.
    """
    if not email_delivery_configured():
        raise EmailDeliveryNotConfigured(
            "Email delivery is disabled until SMTP is configured."
        )

    message = EmailMessage()
    message["From"] = formataddr(
        (settings.SMTP_FROM_NAME, settings.SMTP_FROM_EMAIL)
    )
    message["To"] = recipient
    message["Subject"] = subject
    message_id = make_msgid()
    message["Message-ID"] = message_id
    message.set_content(body)

    try:
        if settings.SMTP_SECURITY == "ssl":
            smtp_client = smtplib.SMTP_SSL(
                settings.SMTP_HOST,
                settings.SMTP_PORT,
                timeout=settings.SMTP_TIMEOUT_SECONDS,
                context=ssl.create_default_context(),
            )
        else:
            smtp_client = smtplib.SMTP(
                settings.SMTP_HOST,
                settings.SMTP_PORT,
                timeout=settings.SMTP_TIMEOUT_SECONDS,
            )

        with smtp_client as server:
            if settings.SMTP_SECURITY == "starttls":
                server.starttls(context=ssl.create_default_context())
            if settings.SMTP_USERNAME:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)
    except (OSError, smtplib.SMTPException, ValueError) as exc:
        logger.warning(
            "SMTP feedback delivery failed (%s).",
            type(exc).__name__,
        )
        raise EmailDeliveryError(
            "The configured email provider could not deliver this message."
        ) from exc

    return {
        "status": "sent",
        "provider": "smtp",
        "message_id": message_id,
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }
