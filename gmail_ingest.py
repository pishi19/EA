"""
gmail_ingest.py

Parses Gmail threads and writes tasks to Signal_Tasks.md in the correct location.
"""

from pathlib import Path

SIGNAL_TASKS_PATH = Path("/Users/air/AIR01/0001-HQ/Signal_Tasks.md")

def append_task_to_signal_file(task_line):
    SIGNAL_TASKS_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not SIGNAL_TASKS_PATH.exists():
        SIGNAL_TASKS_PATH.write_text("# 📨 Email Tasks\n\n")
    with SIGNAL_TASKS_PATH.open("a") as f:
        f.write(f"- [ ] {task_line}\n")

# Simulated task appending for test
def main():
    example_task = "Follow up on: Billing confusion email from support"
    append_task_to_signal_file(example_task)
    print(f"✅ Task written to {SIGNAL_TASKS_PATH}")

if __name__ == "__main__":
    main()
