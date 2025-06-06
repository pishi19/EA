import streamlit as st
import sqlite3
import os
import frontmatter

st.set_page_config(page_title="Promote Loops", layout="wide")

def load_promotable_loops():
    """
    Loads loops from the database that have not yet been promoted to the roadmap.
    """
    promoted = set()
    roadmap_path = "runtime/roadmap"
    if os.path.exists(roadmap_path):
        for fname in os.listdir(roadmap_path):
            if fname.endswith(".md"):
                try:
                    post = frontmatter.load(os.path.join(roadmap_path, fname))
                    if "origin_loop" in post:
                        promoted.add(post["origin_loop"])
                except Exception:
                    # Ignore malformed or unparseable files
                    continue

    db_path = "runtime/db/ora.db"
    if not os.path.exists(db_path):
        st.error(f"Database not found at: {db_path}")
        return []
        
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    try:
        cur.execute("SELECT uuid, title, workstream, score FROM loop_metadata WHERE workstream IS NOT NULL")
        rows = cur.fetchall()
    except sqlite3.OperationalError:
        st.warning("`loop_metadata` table not found in database.")
        rows = []
    conn.close()

    # Filter out loops that are already promoted
    return [
        {"uuid": r[0], "title": r[1], "workstream": r[2], "score": r[3]}
        for r in rows
        if r[0] not in promoted
    ]

# --- Main UI ---
st.header("🔁 Promote Loops to Roadmap")
st.caption("Select loops to promote into active workstream items.")

promotable_loops = load_promotable_loops()

if not promotable_loops:
    st.success("✅ No promotable loops found. All recent loops have been promoted.")
else:
    for loop in promotable_loops:
        with st.expander(f"{loop['title']} (Workstream: {loop.get('workstream', 'N/A')})"):
            st.markdown(f"**UUID:** `{loop['uuid']}`")
            st.markdown(f"**Workstream:** `{loop['workstream']}`")
            st.markdown(f"**Score:** `{loop.get('score', 'N/A')}`")
            if st.button("Promote This Loop", key=loop['uuid']):
                # Trigger assistant command by writing to a file queue
                # This assumes an external process is watching this file.
                try:
                    os.makedirs(".cursor", exist_ok=True)
                    with open(".cursor/prompt_queue.txt", "a") as f:
                        f.write(f"/promote_loop {loop['uuid']}\\n")
                    st.success(f"✅ Promotion for loop `{loop['uuid']}` queued.")
                    st.experimental_rerun()
                except Exception as e:
                    st.error(f"Failed to queue promotion command: {e}") 