import sqlite3
import subprocess
import sys
from datetime import datetime

# Config
DB_PATH = "/Users/air/ea_assistant/db/loop_feedback.db"
UPDATE_SCRIPT_PATH = "/Users/air/ea_assistant/update_loop_file.py"

def connect_db():
    return sqlite3.connect(DB_PATH)

def log_feedback(loop_id, feedback_type, source="obsidian"):
    if feedback_type not in ["useful", "noise"]:
        print(f"❌ Invalid feedback type: {feedback_type}")
        return
    timestamp = datetime.now().isoformat()
    entry_id = f"{loop_id}-{feedback_type}-{timestamp}"
    with connect_db() as conn:
        conn.execute(
            "INSERT INTO loop_feedback (id, loop_id, feedback_type, timestamp, source) VALUES (?, ?, ?, ?, ?)",
            (entry_id, loop_id, feedback_type, timestamp, source)
        )
        conn.commit()
    print(f"✅ Logged {feedback_type} feedback for loop: {loop_id}")

    # Optional: backpropagate to loop file
    subprocess.run(["python3", UPDATE_SCRIPT_PATH, loop_id, feedback_type])

def main():
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

if __name__ == "__main__":
    main()
