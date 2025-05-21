import subprocess
import time

SIGNAL_TASKS_PATH = "/Users/air/AIR01/0001 HQ/Signal_Tasks.md"
ARCHIVE_SCRIPT_PATH = "/Users/air/ea_assistant/archive_checked_emails.py"
LOG_PATH = "/Users/air/AIR01/System/Logs/email-archive-log.md"

task_line = f"- [x] Auto-test Gmail archival threadId:FMfcgzQbfLWxrMPvCzFqQxjVnFRGgBCS\n"

# Step 1: Append test task to Signal_Tasks.md
with open(SIGNAL_TASKS_PATH, "a", encoding="utf-8") as f:
    f.write("\n## 🧪 Automated Test\n")
    f.write(task_line)

print("✅ Injected test task into Signal_Tasks.md")

# Step 2: Run the archive script
print("🚀 Running archive script...")
subprocess.run(["python3", ARCHIVE_SCRIPT_PATH], check=True)

# Step 3: Brief pause to ensure logging is complete
time.sleep(1)

# Step 4: Read and print the log
print("📄 Log output:")
with open(LOG_PATH, "r", encoding="utf-8") as f:
    lines = f.readlines()
    relevant = [line for line in lines if "FMfcgzQbfLWxrMPvCzFqQxjVnFRGgBCS" in line]
    print("".join(relevant[-10:]) if relevant else "⚠️ No log output for this thread.")
