import sqlite3

from src.path_config import MCP_MEMORY_DB


def get_open_loops(limit=5) -> list[dict]:
    if not MCP_MEMORY_DB.exists():
        return []

    conn = sqlite3.connect(MCP_MEMORY_DB)
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT loop_id, summary, tags, topic, source, created_at, status
        FROM loops
        WHERE status = 'open'
        ORDER BY created_at DESC
        LIMIT ?
    """,
        (limit,),
    )

    rows = cursor.fetchall()
    conn.close()

    loops = []
    for row in rows:
        loop_id, summary, tags, topic, source, created_at, status = row
        loops.append(
            {
                "id": loop_id,
                "summary": summary or "(no summary)",
                "tags": tags,
                "topic": topic,
                "source": source,
                "created_at": created_at,
                "status": status,
            }
        )

    return loops


def format_loops_for_gpt(loops: list[dict]) -> str:
    if not loops:
        return "There are no open loops in memory at this time."

    formatted = ["Here are the current open loops in memory:"]
    for loop in loops:
        formatted.append(
            f"- **{loop['topic'] or loop['id']}** (status: {loop['status']}, tags: {loop['tags']}, source: {loop['source']}) — {loop['summary']}"
        )
    formatted.append("\nYou can close any of these loops when appropriate.")
    return "\n".join(formatted)


# CLI usage
if __name__ == "__main__":
    loops = get_open_loops()
    print(format_loops_for_gpt(loops))
