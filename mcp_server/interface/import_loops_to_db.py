import json
import sqlite3
from pathlib import Path
from datetime import datetime

# Paths
json_path = Path("/Users/air/ea_assistant/mcp_server/loops/loop_memory.json")
db_path = Path("/Users/air/ea_assistant/mcp_server/loops/mcp_memory.db")

def load_json():
    if not json_path.exists():
        print("❌ loop_memory.json not found.")
        return []
    with open(json_path, "r") as f:
        return json.load(f)

def insert_loop(cursor, loop):
    try:
        cursor.execute(
            "INSERT INTO loops (id, summary, status, tags, source, created, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                loop["id"],
                loop["summary"],
                loop["status"],
                json.dumps(loop.get("tags", [])),
                loop.get("source", ""),
                datetime.now().isoformat(),
                datetime.now().isoformat()
            )
        )
        return True
    except sqlite3.IntegrityError:
        return False  # Duplicate

def main():
    data = load_json()
    if not data:
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    inserted = 0
    for loop in data:
        if insert_loop(cursor, loop):
            print(f"✅ Imported: {loop['id']}")
            inserted += 1
        else:
            print(f"⏭️ Skipped (already exists): {loop['id']}")

    conn.commit()
    conn.close()

    print(f"✅ Finished importing. {inserted} new loop(s) added.")

if __name__ == "__main__":
    main()
