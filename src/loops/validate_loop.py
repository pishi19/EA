"""
validate_loop.py

Adds feedback to a loop (useful, false_positive, etc.), updates SQLite, YAML, and logs feedback.
"""

import argparse
import sqlite3
from datetime import datetime

from src.system.path_config import LOG_DIR, LOOP_MEMORY_DB, RETRO_PATH

LOG_PATH = LOG_DIR / "loop_feedback_log.md"
RETRO_DIR = RETRO_PATH


def update_sqlite_feedback(loop_id, feedback):
    conn = sqlite3.connect(LOOP_MEMORY_DB)
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE loops ADD COLUMN feedback TEXT")  # ignore if already exists
    try:
        cursor.execute("UPDATE loops SET feedback = ? WHERE id = ?", (feedback, loop_id))
    except Exception as e:
        print(f"⚠️ Could not update feedback in SQLite: {e}")
    conn.commit()
    conn.close()


def update_yaml_file(loop_id, feedback):
    loop_file = RETRO_DIR / f"{loop_id}.md"
    if not loop_file.exists():
        print(f"⚠️ Loop file {loop_file} not found.")
        return

    lines = loop_file.read_text().splitlines()
    for i, line in enumerate(lines):
        if line.strip().startswith("feedback:"):
            lines[i] = f"feedback: {feedback}"
            break
    else:
        # Insert just before the closing frontmatter
        for i, line in enumerate(lines):
            if line.strip() == "---":
                lines.insert(i, f"feedback: {feedback}")
                break
    loop_file.write_text("\n".join(lines))
    print(f"✅ YAML updated in {loop_file.name}")


def log_feedback(loop_id, feedback):
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a") as log:
        log.write(
            f"- {datetime.now().isoformat(timespec='seconds')} — `{loop_id}` marked as **{feedback}**\n"
        )


def main():
    parser = argparse.ArgumentParser(description="Add feedback to a loop")
    parser.add_argument("loop_id", help="The loop ID to tag")
    parser.add_argument("--feedback", choices=["useful", "false_positive", "stale"], required=True)
    args = parser.parse_args()

    update_sqlite_feedback(args.loop_id, args.feedback)
    update_yaml_file(args.loop_id, args.feedback)
    log_feedback(args.loop_id, args.feedback)

    print(f"✅ Feedback '{args.feedback}' applied to loop {args.loop_id}")


if __name__ == "__main__":
    main()
