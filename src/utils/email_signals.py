import json
import logging
import smtplib
import time
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


class EmailManager:
    def __init__(self, smtp_host: str, smtp_port: int, username: str, password: str):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        self.max_retries = 3
        self.retry_delay = 5  # seconds
        self.failed_emails_dir = Path("/Users/air/AIR01/System/Logs/failed_emails")
        self.failed_emails_dir.mkdir(parents=True, exist_ok=True)

    def _create_message(
        self,
        to_emails: list[str],
        subject: str,
        body: str,
        html_body: Optional[str] = None,
    ) -> MIMEMultipart:
        """Create email message with optional HTML content."""
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self.username
        msg["To"] = ", ".join(to_emails)

        # Add plain text version
        msg.attach(MIMEText(body, "plain"))

        # Add HTML version if provided
        if html_body:
            msg.attach(MIMEText(html_body, "html"))

        return msg

    def _log_failed_email(self, to_emails: list[str], subject: str, body: str, error: str):
        """Log failed email for retry."""
        timestamp = datetime.now().isoformat()
        failed_email = {
            "timestamp": timestamp,
            "to": to_emails,
            "subject": subject,
            "body": body,
            "error": str(error),
        }

        log_file = self.failed_emails_dir / f"failed_email_{timestamp}.json"
        with log_file.open("w") as f:
            json.dump(failed_email, f, indent=2)

        logger.error(f"Failed to send email to {to_emails}: {error}")

    def send_email(
        self,
        to_emails: list[str],
        subject: str,
        body: str,
        html_body: Optional[str] = None,
    ) -> bool:
        """Send email with retry logic."""
        msg = self._create_message(to_emails, subject, body, html_body)

        for attempt in range(self.max_retries):
            try:
                with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.username, self.password)
                    server.send_message(msg)
                logger.info(f"Email sent successfully to {to_emails}")
                return True
            except Exception as e:
                if attempt < self.max_retries - 1:
                    logger.warning(
                        f"Failed to send email (attempt {attempt + 1}/{self.max_retries}): {e}"
                    )
                    time.sleep(self.retry_delay)
                else:
                    self._log_failed_email(to_emails, subject, body, e)
                    return False

    def retry_failed_emails(self, max_age_hours: int = 24) -> int:
        """Retry sending failed emails from the last N hours."""
        retry_count = 0
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)

        for log_file in self.failed_emails_dir.glob("failed_email_*.json"):
            try:
                with log_file.open() as f:
                    failed_email = json.load(f)

                # Check if email is too old
                failed_time = datetime.fromisoformat(failed_email["timestamp"])
                if failed_time < cutoff_time:
                    log_file.unlink()
                    continue

                # Retry sending
                if self.send_email(
                    failed_email["to"], failed_email["subject"], failed_email["body"]
                ):
                    log_file.unlink()
                    retry_count += 1
            except Exception as e:
                logger.error(f"Error processing failed email {log_file}: {e}")

        return retry_count


def get_email_manager() -> EmailManager:
    """Get configured email manager instance."""
    from .config import get_config

    config = get_config()

    return EmailManager(
        smtp_host=config["SMTP_HOST"],
        smtp_port=config["SMTP_PORT"],
        username=config["SMTP_USERNAME"],
        password=config["SMTP_PASSWORD"],
    )
