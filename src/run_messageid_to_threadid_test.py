import subprocess
import time

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from src.path_config import TOKEN_PATH, ARCHIVE_SCRIPT

# === CONFIG ===
SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]
TOKEN_PATH = str(TOKEN_PATH)
SIGNAL_TASKS_PATH = "/Users/air/AIR01/0001 HQ/Signal_Tasks.md"
ARCHIVE_SCRIPT_PATH = str(ARCHIVE_SCRIPT)
LOG_PATH = "/Users/air/AIR01/System/Logs/email-archive-log.md"
MESSAGE_ID = "1832580529983915806"

# === INIT GMAIL SERVICE ===
creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
service = build("gmail", "v1", credentials=creds)

# === RESOLVE threadId FROM messageId ===
print(f"🔍 Resolving threadId from messageId: {MESSAGE_ID}")
response = service.users().messages().get(userId="me", id=MESSAGE_ID).execute()
thread_id = response.get("threadId")
if not thread_id:
    print("❌ Failed to resolve threadId.")
    exit(1)
print(f"✅ Resolved threadId: {thread_id}")

# === INJECT TASK ===
task_line = f"- [x] Auto-test resolved threadId:{thread_id}\n"
with open(SIGNAL_TASKS_PATH, "a", encoding="utf-8") as f:
    f.write("\n## 🧪 Automated MessageID Test\n")
    f.write(task_line)
print("✅ Injected test task into Signal_Tasks.md")

# === RUN ARCHIVE SCRIPT ===
print("🚀 Running archive script...")
subprocess.run(["python3", ARCHIVE_SCRIPT_PATH], check=True)

# === WAIT AND READ LOG ===
time.sleep(1)
print("📄 Log output:")
with open(LOG_PATH, encoding="utf-8") as f:
    lines = f.readlines()
    relevant = [line for line in lines if thread_id in line]
    print("".join(relevant[-10:]) if relevant else "⚠️ No log output for this thread.")
