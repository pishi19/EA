import os
import sqlite3
from datetime import datetime, timedelta
from src.path_config import LOOP_MEMORY_DB

# Allow test override via environment variable
DB_PATH = os.getenv("LOOP_DB_PATH", str(LOOP_MEMORY_DB))


def get_recent_loops(limit=5, days=14):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()

        cursor.execute(
            """
            SELECT summary
            FROM loops
            WHERE created >= ?
            ORDER BY created DESC
            LIMIT ?
        """,
            (cutoff_date, limit),
        )

        rows = cursor.fetchall()
        summaries = [row[0] for row in rows if row[0]]
        conn.close()

        return summaries

    except Exception as e:
        return [f"[Loop memory error: {e}]"]


def format_loops_for_prompt(summaries):
    if not summaries:
        return "No recent loops available."
    return "\n".join(f"- {s}" for s in summaries)
