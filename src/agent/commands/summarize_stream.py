import sqlite3
# Note: This import will likely need adjustment once the project structure for agents is clarified.
from src.data.workstream_loader import load_workstreams

def summarize_stream(workstream_id: str, db_path="runtime/db/ora.db") -> dict:
    """
    Summarizes a workstream's state using SQL-backed data, including
    metadata, loop statistics, and feedback counts.
    """
    # Load workstream metadata from the centralized loader
    # This correctly sources from the workstreams table.
    workstreams = load_workstreams(db_path)
    stream = next((ws for ws in workstreams if ws["id"] == workstream_id), None)
    if not stream:
        return {"error": f"Workstream '{workstream_id}' not found"}

    conn = sqlite3.connect(db_path)
    # Ensure the schema is created before running queries
    with open("runtime/db/schema.sql", 'r') as f:
        conn.executescript(f.read())
        
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Get loops tied to this workstream from the loop_metadata table
    cur.execute("SELECT uuid, title, score, status FROM loop_metadata WHERE workstream=?", (workstream_id,))
    loops = cur.fetchall()

    # Get feedback counts per loop from the loop_feedback table
    feedback = {}
    for loop in loops:
        uuid = loop["uuid"]
        cur.execute("SELECT tag FROM loop_feedback WHERE uuid=?", (uuid,))
        tags = [row["tag"] for row in cur.fetchall()]
        feedback[uuid] = {
            "positive": tags.count("useful"),
            "negative": tags.count("false_positive")
        }

    conn.close()

    return {
        "id": stream["id"],
        "title": stream["title"],
        "goals": stream["goals"],
        "owners": stream["owners"],
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