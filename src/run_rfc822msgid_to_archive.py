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
RFC822_MSG_ID = "901fc22f-1268-4c4e-ba27-1a79018bd087@ind1s01mta850.xt.local"

# === INIT GMAIL SERVICE ===
creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
service = build("gmail", "v1", credentials=creds)

# === SEARCH MESSAGE BY RFC822 MESSAGE-ID ===
query = f"rfc822msgid:{RFC822_MSG_ID}"
results = service.users().messages().list(userId="me", q=query).execute()
messages = results.get("messages", [])

if not messages:
    print(f"❌ No message found for RFC822 msgid: {RFC822_MSG_ID}")
    exit(1)

message_id = messages[0]["id"]
msg = service.users().messages().get(userId="me", id=message_id).execute()
thread_id = msg.get("threadId")

if not thread_id:
    print("❌ Failed to resolve threadId.")
    exit(1)

print(f"✅ Resolved threadId: {thread_id}")

# === INJECT TASK ===
task_line = f"- [x] Auto-test resolved threadId:{thread_id}\n"
with open(SIGNAL_TASKS_PATH, "a", encoding="utf-8") as f:
    f.write("\n## 🧪 RFC822 Message-ID Test\n")
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
