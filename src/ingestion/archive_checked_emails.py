# FINAL VERSION — uses threads().modify ONLY, no messageId references

import logging
import os
import re

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# ========== CONFIG ==========
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']
TOKEN_PATH = '/Users/air/ea_assistant/token.json'
CREDENTIALS_PATH = '/Users/air/ea_assistant/credentials_gmail.json'
VAULT_LOG_PATH = '/Users/air/AIR01/System/Logs/email-archive-log.md'
SIGNAL_TASKS_PATH = '/Users/air/AIR01/0001 HQ/Signal_Tasks.md'

# ========== LOGGING ==========
logging.basicConfig(
    filename=VAULT_LOG_PATH,
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s'
)

# ========== INIT GMAIL API ==========
creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
service = build('gmail', 'v1', credentials=creds)

# ========== ARCHIVE FUNCTION ==========
def archive_thread(thread_id):
    try:
        # Step 1: Archive thread
        service.users().threads().modify(
            userId='me',
            id=thread_id,
            body={'removeLabelIds': ['INBOX']}
        ).execute()
        logging.info(f"🟡 Archive request sent for thread: {thread_id}")

        # Step 2: Fetch thread to confirm archival
        updated_thread = service.users().threads().get(userId='me', id=thread_id).execute()

        inbox_found = False
        for msg in updated_thread.get("messages", []):
            labels = msg.get("labelIds", [])
            if 'INBOX' in labels:
                inbox_found = True
                logging.warning(f"⚠️ Thread {thread_id} — message {msg['id']} still has INBOX label!")

        if not inbox_found:
            logging.info(f"✅ Thread {thread_id} successfully archived.")
            return True
        return False

    except Exception as e:
        logging.error(f"❌ Failed to archive thread {thread_id}: {e}")
        return False

# ========== EXTRACT THREAD ID FROM TASK BLOCK ==========
def extract_thread_id(task_line):
    match = re.search(r'threadId:([a-zA-Z0-9_-]+)', task_line)
    return match.group(1) if match else None

# ========== MAIN ==========
def main():
    if not os.path.exists(SIGNAL_TASKS_PATH):
        logging.error(f"Signal tasks file not found: {SIGNAL_TASKS_PATH}")
        return

    with open(SIGNAL_TASKS_PATH, 'r') as f:
        lines = f.readlines()

    for line in lines:
        if line.strip().startswith("- [x]") and 'threadId:' in line:
            thread_id = extract_thread_id(line)
            if thread_id:
                logging.info(f"🔍 Processing block: {line.strip()}")
                archive_thread(thread_id)

if __name__ == "__main__":
    main()
