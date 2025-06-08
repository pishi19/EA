import sqlite3
import sys
from datetime import datetime
from typing import Literal, NoReturn

from src.path_config import DB_LOOP_FEEDBACK

# Config

FeedbackType = Literal["useful", "noise"]
SourceType = Literal["obsidian", "manual"]


def connect_db() -> sqlite3.Connection:
    return sqlite3.connect(DB_LOOP_FEEDBACK)


def log_feedback(
    loop_id: str, feedback_type: FeedbackType, source: SourceType = "obsidian"
) -> None:
    if feedback_type not in ["useful", "noise"]:
        print(f"❌ Invalid feedback type: {feedback_type}")
        return
    timestamp = datetime.now().isoformat()
    entry_id = f"{loop_id}-{feedback_type}-{timestamp}"
    with connect_db() as conn:
        conn.execute(
            "INSERT INTO loop_feedback (id, loop_id, feedback_type, timestamp, source) VALUES (?, ?, ?, ?, ?)",
            (entry_id, loop_id, feedback_type, timestamp, source),
        )
        conn.commit()
    print(f"✅ Logged {feedback_type} feedback for loop: {loop_id}")


def main() -> NoReturn:
    if len(sys.argv) != 3:
        print("Usage: python3 feedback.py [mark-useful|mark-noise] <loop_id>")
        sys.exit(1)

    command = sys.argv[1]
    loop_id = sys.argv[2]

    if command == "mark-useful":
        log_feedback(loop_id, "useful")
    elif command == "mark-noise":
        log_feedback(loop_id, "noise")
    else:
        print(f"❌ Unknown command: {command}")
        sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()
