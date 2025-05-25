import os
import re
from datetime import datetime

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from src.path_config import TOKEN_PATH

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
TOKEN_PATH = str(TOKEN_PATH)
SIGNAL_TASKS_PATH = "/Users/air/AIR01/0001 HQ/Signal_Tasks.md"
SYNC_LOG_PATH = f'/Users/air/AIR01/System/Logs/gmail-sync-{datetime.now().strftime("%Y-%m-%d")}.md'


def get_today_thread_ids():
    creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    service = build("gmail", "v1", credentials=creds)

    now = datetime.utcnow()
    start_of_day = datetime(now.year, now.month, now.day)
    after_timestamp = int(start_of_day.timestamp())
    query = f"after:{after_timestamp}"

    response = service.users().messages().list(userId="me", q=query).execute()
    messages = response.get("messages", [])

    thread_ids = {}
    for msg in messages:
        message_data = service.users().messages().get(userId="me", id=msg["id"]).execute()
        thread_id = message_data.get("threadId")
        subject = "No Subject"
        headers = message_data.get("payload", {}).get("headers", [])
        for header in headers:
            if header["name"].lower() == "subject":
                subject = header["value"]
                break
        thread_ids[thread_id] = subject
    return thread_ids


def extract_thread_ids_from_tasks():
    if not os.path.exists(SIGNAL_TASKS_PATH):
        return []

    with open(SIGNAL_TASKS_PATH, encoding="utf-8") as f:
        content = f.read()

    return re.findall(r"threadId:([a-zA-Z0-9_-]+)", content)


def write_sync_log(today_threads, task_thread_ids):
    with open(SYNC_LOG_PATH, "w", encoding="utf-8") as f:
        f.write(f"# Gmail vs System (as of {datetime.now().strftime('%Y-%m-%d %H:%M')})\n\n")
        for tid, subject in today_threads.items():
            subject_escaped = subject.replace('"', '"')
            if tid in task_thread_ids:
                f.write(f'- ✅ {tid} | "{subject_escaped}" → Found in Signal_Tasks.md\n')
            else:
                f.write(f'- ❌ {tid} | "{subject_escaped}" → MISSING from Signal_Tasks.md\n')
    print(f"✅ Sync report written to: {SYNC_LOG_PATH}")


def main():
    print("🔍 Verifying today's Gmail threads against Signal_Tasks.md...")
    today_threads = get_today_thread_ids()
    task_thread_ids = extract_thread_ids_from_tasks()
    write_sync_log(today_threads, task_thread_ids)


if __name__ == "__main__":
    main()
