"""
test_task_trace_logging.py

Simulates a routed task and writes to task_trace_log.md for validation.
"""

from datetime import datetime
from pathlib import Path

task = "Test task: route this message about failed rent payments"
loop_id = "loop-2025-05-21-summary:-rent-failure"
RETRO_DIR = Path("/Users/air/AIR01/Retrospectives")
trace_path = Path("/Users/air/AIR01/System/Logs/task_trace_log.md")

# Ensure file exists
trace_path.parent.mkdir(parents=True, exist_ok=True)
if not trace_path.exists():
    trace_path.write_text("# 📌 Task Routing Trace Log\n\n")

# Write to log
with trace_path.open("a") as log:
    log.write(
        datetime.now().isoformat(timespec="seconds")
        + ' — Routed task: "'
        + task
        + '" → '
        + loop_id
        + "\n"
    )

# Append backlink to test loop file
loop_file = RETRO_DIR / (loop_id + ".md")
if loop_file.exists():
    block = "\n\n---\n\n🔗 Related Task:\n- " + task + "  \n(from Signal_Tasks.md)\n"
    loop_file.write_text(loop_file.read_text().strip() + block)

print("✅ Test task routed and logged.")
