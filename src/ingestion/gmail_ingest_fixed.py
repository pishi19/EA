import base64
import pickle
import subprocess
from datetime import datetime
from pathlib import Path

from googleapiclient.discovery import build

from src.path_config import SIGNAL_ROUTER, TOKEN_PATH

# Paths
TOKEN_PATH = str(TOKEN_PATH)
SIGNAL_ROUTER = str(SIGNAL_ROUTER)
EMAIL_LOG_PATH = "/Users/air/AIR01/System/Inbox/EmailLog.md"


def get_gmail_service():
    with open(TOKEN_PATH, "rb") as token_file:
        creds = pickle.load(token_file)
    return build("gmail", "v1", credentials=creds)


def extract_header(headers, name, default="(unknown)"):
    return next((h["value"] for h in headers if h["name"].lower() == name.lower()), default)


def classify_email(subject, sender, body):
    if "pricing" in subject.lower() or "rollout" in body.lower():
        return "important"
    return "normal"


def get_gmail_link(thread_id):
    return f"https://mail.google.com/mail/u/0/#inbox/{thread_id}"


def format_email_log_entry(subject, sender, link, date_str):
    return f"""### 🔹 [{subject}]({link})
- **From**: {sender}
- **Date**: {date_str}
- **Linked Task**: In HQ

"""


def update_email_log(entries):
    today = datetime.now().strftime("%Y-%m-%d")
    header = f"# 📨 Email Log - {today}\n\n"
    content = header + "\n".join(entries)
    inbox_path = Path(EMAIL_LOG_PATH)
    inbox_path.parent.mkdir(parents=True, exist_ok=True)
    inbox_path.write_text(content)
    print(f"✅ EmailLog updated at {EMAIL_LOG_PATH}")


def main():
    try:
        print("🔍 Starting Gmail service...")
        service = get_gmail_service()
        print("✅ Gmail service initialized")

        # Get messages from the last 24 hours
        yesterday = int(datetime.now().timestamp() - 86400)

        results = (
            service.users()
            .messages()
            .list(
                userId="me",
                maxResults=100,  # Increased from 10 to 100
                labelIds=["INBOX"],
                q=f"after:{yesterday}",  # Only get messages from last 24 hours
            )
            .execute()
        )

        messages = results.get("messages", [])
        print(f"📨 Found {len(messages)} messages in the last 24 hours")

        email_log_entries = []
        processed_count = 0
        error_count = 0

        for msg_meta in messages:
            try:
                msg_id = msg_meta["id"]
                msg = (
                    service.users().messages().get(userId="me", id=msg_id, format="full").execute()
                )
                payload = msg.get("payload", {})
                headers = payload.get("headers", [])
                subject = extract_header(headers, "Subject", "(no subject)")
                sender = extract_header(headers, "From")
                thread_id = msg.get("threadId")
                link = get_gmail_link(thread_id)
                timestamp = int(msg.get("internalDate", 0)) / 1000
                date_str = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M")

                body_data = payload.get("body", {}).get("data", "")
                try:
                    body = base64.urlsafe_b64decode(body_data + "===").decode("utf-8")
                except Exception:
                    body = ""

                classification = classify_email(subject, sender, body)
                print(f"📧 Processing: {subject} ({classification})")

                if classification == "important":
                    task_description = f"Follow up on: {subject} from {sender}"
                    subprocess.run(["python3", SIGNAL_ROUTER, "📨 Email", task_description, link])
                    print(f"✅ Created task for: {subject}")

                # Log all emails, not just important ones
                email_log_entries.append(format_email_log_entry(subject, sender, link, date_str))
                processed_count += 1

            except Exception as e:
                print(f"❌ Error processing message: {e!s}")
                error_count += 1
                continue

        if email_log_entries:
            update_email_log(email_log_entries)
            print(f"✅ Processed {processed_count} emails ({error_count} errors)")
        else:
            print("i Email processing complete.")

    except Exception as e:
        print(f"❌ Gmail service error: {e!s}")


if __name__ == "__main__":
    main()
