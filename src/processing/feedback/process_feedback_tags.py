from datetime import datetime

TASKS_PATH = "/Users/air/AIR01/0001-HQ/Signal_Tasks.md"
LOG_PATH = "/Users/air/AIR01/System/Logs/feedback_trace_log.md"


def extract_feedback_tasks(path):
    with open(path, encoding="utf-8") as f:
        lines = f.readlines()

    feedback = []
    for line in lines:
        if "#useful" in line or "#false_positive" in line:
            feedback.append(line.strip())
    return feedback


def log_feedback(feedback):
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        for task in feedback:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            tag = "#useful" if "#useful" in task else "#false_positive"
            f.write(f"- [{timestamp}] {tag}: {task}\n")


def main():
    feedback = extract_feedback_tasks(TASKS_PATH)
    log_feedback(feedback)
    print(f"✅ Logged {len(feedback)} feedback items.")


if __name__ == "__main__":
    main()
