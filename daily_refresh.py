
import subprocess
from datetime import datetime
from pathlib import Path

LOG_PATH = "/Users/air/Library/Logs/ora/daily_refresh.log"
LOG_HEADER = f"\n==== Daily Refresh Run: {datetime.now().isoformat()} ===="

TASKS = [
    ("Update Weights", "python3 /Users/air/ea_assistant/weight_loops.py"),
    ("Generate Dashboard", "python3 /Users/air/ea_assistant/generate_loop_dashboard.py"),
    ("Promote Loops", "python3 /Users/air/ea_assistant/promote_loops.py"),
    ("Route Feedback", "python3 /Users/air/ea_assistant/feedback_trace_router.py"),
    ("Log Summary to Obsidian", "python3 /Users/air/ea_assistant/log_daily_summary.py")
]

def run_task(label, command):
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        output = result.stdout.strip()
        error = result.stderr.strip()

        log_entry = f"\n▶ {label}\n{command}\n"
        if output:
            log_entry += f"✅ Output:\n{output}\n"
        if error:
            log_entry += f"❌ Error:\n{error}\n"

        return log_entry
    except Exception as e:
        return f"❌ Exception while running {label}: {e}"

def main():
    Path(LOG_PATH).parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_PATH, "a", encoding="utf-8") as log:
        log.write(LOG_HEADER + "\n")
        for label, command in TASKS:
            result = run_task(label, command)
            log.write(result + "\n")
        log.write("✅ Daily refresh complete.\n")

if __name__ == "__main__":
    main()
