import os
import re
from datetime import datetime

SIGNAL_TASKS_PATH = "/Users/air/AIR01/0001 HQ/Signal_Tasks.md"
FEEDBACK_LOG_PATH = "/Users/air/AIR01/System/Logs/email-feedback-log.md"
VALID_TAGS = ["#useful", "#false_positive", "#ignored", "#noise"]


def extract_feedback_tags(line):
    tags = [tag for tag in VALID_TAGS if tag in line]
    return tags


def extract_thread_id(line):
    match = re.search(r"threadId:([a-zA-Z0-9_-]+)", line)
    return match.group(1) if match else None


def main():
    if not os.path.exists(SIGNAL_TASKS_PATH):
        print(f"❌ File not found: {SIGNAL_TASKS_PATH}")
        return

    with open(SIGNAL_TASKS_PATH, encoding="utf-8") as f:
        lines = f.readlines()

    feedback_entries = []
    for line in lines:
        if line.strip().startswith("- [x]") and "threadId:" in line:
            tags = extract_feedback_tags(line)
            if tags:
                thread_id = extract_thread_id(line)
                timestamp = datetime.now().isoformat()
                feedback_entries.append(
                    f"{timestamp} | {thread_id} | {', '.join(tags)} | {line.strip()}"
                )

    if feedback_entries:
        with open(FEEDBACK_LOG_PATH, "a", encoding="utf-8") as log_file:
            log_file.write("\n".join(feedback_entries) + "\n")
        print(f"✅ Logged {len(feedback_entries)} feedback entries.")
    else:
        print("ℹ️ No feedback-tagged tasks found.")


if __name__ == "__main__":
    main()
