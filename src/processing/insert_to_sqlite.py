"""
insert_to_sqlite.py

Inserts the loop metadata into the SQLite loop memory DB.
"""

import sqlite3
from datetime import date
from pathlib import Path

from src.system.path_config import LOOP_MEMORY_DB

# Ensure the database directory exists
db_path = Path(LOOP_MEMORY_DB)

def insert_to_sqlite(loop_id, summary, metadata):
    conn = sqlite3.connect(LOOP_MEMORY_DB)
    cursor = conn.cursor()

    # Ensure the table exists
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS loops (
            id TEXT PRIMARY KEY,
            summary TEXT,
            tags TEXT,
            status TEXT,
            type TEXT,
            priority TEXT,
            source TEXT,
            created DATE
        )
    """
    )

    cursor.execute(
        """
        INSERT OR REPLACE INTO loops (
            id, summary, tags, status, type, priority, source, created
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """,
        (
            loop_id,
            summary,
            ", ".join(metadata["tags"]),
            metadata["status"],
            metadata["type"],
            metadata["priority"],
            metadata["source"],
            str(date.today()),
        ),
    )

    conn.commit()
    conn.close()
    print(f"✅ Inserted {loop_id} into SQLite at {LOOP_MEMORY_DB}")
