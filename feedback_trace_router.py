
import re
from pathlib import Path
from datetime import datetime

TASKS_PATH = "/Users/air/AIR01/0001-HQ/Signal_Tasks.md"
LOG_PATH = "/Users/air/AIR01/System/Logs/feedback_routed_log.md"

def extract_feedback_with_links():
    with open(TASKS_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()

    feedback = []
    for line in lines:
        if "#useful" in line or "#false_positive" in line:
            matches = re.findall(r"→ \[\[([^\]]+)\]\]", line)
            for target in matches:
                tag = "#useful" if "#useful" in line else "#false_positive"
                feedback.append((target, tag, line.strip()))
    return feedback

def log_feedback_links(feedback):
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        for target, tag, line in feedback:
            f.write(f"{datetime.now().isoformat()} — Feedback {tag} for → [[{target}]] from task: {line}\n")
    print(f"✅ Routed feedback for {len(feedback)} items.")

def main():
    feedback = extract_feedback_with_links()
    log_feedback_links(feedback)

if __name__ == "__main__":
    main()
