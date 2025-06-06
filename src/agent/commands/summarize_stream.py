import sqlite3
import pandas as pd

def summarize_stream(workstream_id: str, db_path="runtime/db/ora.db") -> dict:
    """
    Summarizes a workstream's state using SQL-backed data, including
    metadata, loop statistics, and feedback counts.
    """
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Load the specific workstream directly from the DB
    cur.execute("SELECT * FROM workstreams WHERE id=?", (workstream_id,))
    stream_data = cur.fetchone()
    if not stream_data:
        conn.close()
        return {"error": f"Workstream '{workstream_id}' not found"}

    # Get loops tied to this workstream from the loop_metadata table
    cur.execute("SELECT uuid, title, score, status FROM loop_metadata WHERE workstream=?", (workstream_id,))
    loops = cur.fetchall()

    # Get feedback counts per loop from the loop_feedback table
    feedback = {}
    if loops:
        for loop in loops:
            uuid = loop["uuid"]
            cur.execute("SELECT tag FROM loop_feedback WHERE uuid=?", (uuid,))
            tags = [row["tag"] for row in cur.fetchall()]
            feedback[uuid] = {
                "positive": tags.count("useful"),
                "negative": tags.count("false_positive")
            }

    conn.close()

    # Process goals and owners from comma-separated strings
    goals = stream_data["goals"].split(', ') if stream_data["goals"] else []
    owners = stream_data["owners"].split(',') if stream_data["owners"] else []

    return {
        "id": stream_data["id"],
        "title": stream_data["title"],
        "goals": goals,
        "owners": owners,
        "num_loops": len(loops),
        "sample_loops": [
            {
                "uuid": l["uuid"],
                "title": l["title"],
                "score": l["score"],
                "status": l["status"],
                "feedback": feedback.get(l["uuid"], {})
            }
            for l in loops[:5]
        ]
    } 