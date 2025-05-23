# This patch illustrates how to route tasks from important emails into the HQ signal task file.

import base64
import subprocess


def extract_message_id(headers):
    for h in headers:
        if h['name'].lower() == 'message-id':
            return h['value'].strip('<>')
    return None

def get_gmail_link(message_id):
    return f"https://mail.google.com/mail/u/0/#all/{message_id}"

def classify_email(subject, sender, body):
    # Placeholder logic — in production, call GPT or keyword model
    if "pricing" in subject.lower() or "rollout" in body.lower():
        return "important"
    return "normal"

def process_email(msg):
    payload = msg.get("payload", {})
    headers = payload.get("headers", [])
    message_id = extract_message_id(headers)
    subject = next((h["value"] for h in headers if h["name"].lower() == "subject"), "(no subject)")
    sender = next((h["value"] for h in headers if h["name"].lower() == "from"), "(unknown sender)")

    body_data = payload.get("body", {}).get("data")
    body = base64.urlsafe_b64decode(body_data).decode("utf-8") if body_data else ""

    classification = classify_email(subject, sender, body)

    if classification == "important" and message_id:
        task = f"Follow up on: {subject} from {sender}"
        gmail_link = get_gmail_link(message_id)

        # Route to Signal_Tasks.md
        subprocess.run([
            "python3",
            "/Users/air/ea_assistant/task_signal_router.py",
            "📨 Email",
            task,
            gmail_link
        ])
        print(f"✅ Routed email task: {subject}")
    else:
        print(f"ℹ️ Skipped: {subject}")

# Example mock message
if __name__ == "__main__":
    mock_message = {
        "payload": {
            "headers": [
                {"name": "Message-ID", "value": "<abc123@example.com>"},
                {"name": "Subject", "value": "Pricing rollout update"},
                {"name": "From", "value": "jane@example.com"}
            ],
            "body": {
                "data": base64.urlsafe_b64encode(b"Hi, here's the update on the pricing rollout.").decode("utf-8")
            }
        }
    }
    process_email(mock_message)
