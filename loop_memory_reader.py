import sqlite3
from pathlib import Path
from typing import List, Dict

DB_PATH = Path("/Users/air/ea_assistant/mcp_memory.db")

def get_open_loops(limit=5) -> List[Dict]:
    if not DB_PATH.exists():
        return []

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT loop_id, summary, tags, topic, source, created_at
        FROM loops
        WHERE status = 'open'
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))

    rows = cursor.fetchall()
    conn.close()

    loops = []
    for row in rows:
        loop_id, summary, tags, topic, source, created_at = row
        loops.append({
            "id": loop_id,
            "summary": summary or "(no summary)",
            "tags": tags,
            "topic": topic,
            "source": source,
            "created_at": created_at
        })

    return loops

def format_loops_for_gpt(loops: List[Dict]) -> str:
    if not loops:
        return "There are no open loops in memory at this time."

    formatted = ["Here are the current open loops in memory:"]
    for loop in loops:
        formatted.append(
            f"- **{loop['topic'] or loop['id']}** (tags: {loop['tags']}, source: {loop['source']}) — {loop['summary']}"
        )
    return "\n".join(formatted)

# CLI usage
if __name__ == "__main__":
    loops = get_open_loops()
    print(format_loops_for_gpt(loops))
