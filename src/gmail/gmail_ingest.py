import json
from datetime import datetime
from pathlib import Path


class GmailIngest:
    def __init__(self):
        # Paths
        self.vault_path = Path("/Users/air/AIR01/0001-HQ/Signal_Tasks.md")
        self.processed_path = Path.home() / "ea_assistant" / "gmail" / "processed_threads.json"
        self.log_path = Path.home() / "ea_assistant" / "Logs" / "email_ingest_log.md"

        # Ensure processed_threads.json exists
        self.processed_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.processed_path.exists():
            self.processed_path.write_text("{}")

        # Load processed thread IDs
        with self.processed_path.open("r") as f:
            self.processed = json.load(f)

    def get_stats(self):
        """Get email processing statistics"""
        return {
            "total_emails": len(self.processed),
            "processed_today": sum(
                1
                for thread_id in self.processed
                if thread_id.startswith(f"test-{datetime.now().strftime('%Y%m%d')}")
            ),
            "pending_tasks": len(
                self.processed
            ),  # This is a placeholder - we should count actual pending tasks
        }

    def process_new_emails(self):
        """Process new emails and add them to the task list"""
        # Simulated incoming emails (in real use, replace this block with Gmail API results)
        emails = [
            {
                "threadId": "test-" + datetime.now().strftime("%Y%m%d%H%M%S"),
                "subject": "Test Email Ingestion @ " + datetime.now().isoformat(),
                "from": "sender@example.com",
                "link": "https://mail.google.com/mail/u/0/#inbox/thread-id-placeholder",
            }
        ]

        # Open task file for appending
        with self.vault_path.open("a") as vault, self.log_path.open("a") as log:
            for email in emails:
                if email["threadId"] in self.processed:
                    continue  # Already processed

                timestamp = datetime.now().isoformat()
                task_line = f"- [ ] Follow up on: {email['subject']} from {email['from']} — [View source]({email['link']}) threadId:{email['threadId']} #email #ingested_at:{timestamp}\n"

                vault.write(task_line)
                log.write(
                    f"{timestamp} — Ingested: {email['subject']} (threadId: {email['threadId']})\n"
                )

                self.processed[email["threadId"]] = True

        # Save updated processed threads
        with self.processed_path.open("w") as f:
            json.dump(self.processed, f)

        return len(emails)
