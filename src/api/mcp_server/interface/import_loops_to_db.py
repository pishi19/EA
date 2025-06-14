import json
import sqlite3
from datetime import datetime

from src.path_config import MCP_MEMORY_DB, MCP_MEMORY_JSON


def load_json():
    if not MCP_MEMORY_JSON.exists():
        print("❌ loop_memory.json not found.")
        return []
    with open(MCP_MEMORY_JSON) as f:
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
                datetime.now().isoformat(),
            ),
        )
        return True
    except sqlite3.IntegrityError:
        return False  # Duplicate


def main():
    data = load_json()
    if not data:
        return

    conn = sqlite3.connect(MCP_MEMORY_DB)
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
