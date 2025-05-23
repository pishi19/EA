import os
import re
from datetime import datetime

TASKS_PATH = "/Users/air/AIR01/0001 HQ/Signal_Tasks.md"
ARCHIVE_LOG_PATH = "/Users/air/AIR01/System/Logs/email-archive-log.md"
CLEANUP_LOG_PATH = "/Users/air/AIR01/System/Logs/signal-task-cleanup.md"

def get_successfully_archived_thread_ids():
    if not os.path.exists(ARCHIVE_LOG_PATH):
        return set()
    thread_ids = set()
    with open(ARCHIVE_LOG_PATH, "r", encoding="utf-8") as f:
        for line in f:
            match = re.search(r"✅ Thread ([a-zA-Z0-9_-]+) successfully archived", line)
            if match:
                thread_ids.add(match.group(1))
    return thread_ids

def clean_signal_tasks(success_ids):
    if not os.path.exists(TASKS_PATH):
        print(f"❌ File not found: {TASKS_PATH}")
        return

    with open(TASKS_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()

    new_lines = []
    removed = []

    for line in lines:
        if line.strip().startswith("- [x]") and "threadId:" in line:
            match = re.search(r"threadId:([a-zA-Z0-9_-]+)", line)
            if match and match.group(1) in success_ids:
                removed.append(line.strip())
                continue
        new_lines.append(line)

    with open(TASKS_PATH, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

    if removed:
        with open(CLEANUP_LOG_PATH, "a", encoding="utf-8") as log:
            log.write(f"\n## Cleanup log: {datetime.now().isoformat()}\n")
            for line in removed:
                log.write(f"- Removed: {line}\n")
        print(f"✅ Removed {len(removed)} archived tasks from Signal_Tasks.md")
    else:
        print("ℹ️ No matching completed tasks found for cleanup.")

def main():
    archived_ids = get_successfully_archived_thread_ids()
    clean_signal_tasks(archived_ids)

if __name__ == "__main__":
    main()
