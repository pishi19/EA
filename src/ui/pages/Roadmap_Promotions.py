import streamlit as st
import sqlite3
import os
import frontmatter
from pathlib import Path

# Step 1: Find project root based on src/ui/pages/
# This assumes the script is in a directory like `src/ui/pages/`
PROJECT_ROOT = Path(__file__).resolve().parents[3]
ROADMAP_DIR = PROJECT_ROOT / "runtime" / "roadmap"
DB_PATH = PROJECT_ROOT / "runtime" / "db" / "ora.db"

# Step 2: Load promoted origin_loop IDs from roadmap markdown files
promoted_loop_uuids = set()
if ROADMAP_DIR.exists():
    for fname in os.listdir(ROADMAP_DIR):
        if fname.endswith(".md"):
            try:
                post = frontmatter.load(ROADMAP_DIR / fname)
                if "origin_loop" in post:
                    promoted_loop_uuids.add(post["origin_loop"])
            except Exception as e:
                st.warning(f"Failed to read {fname}: {e}")

# Step 3: Load all loops from loop_metadata
all_loops = []
if DB_PATH.exists():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    try:
        cur.execute("SELECT uuid, title, workstream, score FROM loop_metadata")
        rows = cur.fetchall()
        all_loops = [
            {"uuid": r[0], "title": r[1], "workstream": r[2], "score": r[3]}
            for r in rows
            if r[2]  # must have a workstream
        ]
    except Exception as e:
        st.warning(f"Could not query loop_metadata: {e}")
    conn.close()

# Step 4: Filter promotable loops
promotable_loops = [l for l in all_loops if l["uuid"] not in promoted_loop_uuids]

# Step 5: Debug output
st.header("🔁 Promote Loops to Roadmap")
st.subheader("🔎 Debug Output")
st.code(f"Project Root: {PROJECT_ROOT}")
st.code(f"Loaded loops from DB: {len(all_loops)}")
st.code(f"Loops already promoted: {len(promoted_loop_uuids)}")
st.code(f"Promotable candidates: {len(promotable_loops)}")

# Step 6: Display promotion list
if not promotable_loops:
    st.success("✅ No promotable loops found. All have been promoted.")
else:
    for loop in promotable_loops:
        with st.expander(loop["title"]):
            st.markdown(f"**UUID:** {loop['uuid']}")
            st.markdown(f"**Workstream:** {loop['workstream']}")
            st.markdown(f"**Score:** {loop['score']}")
            if st.button(f"Promote {loop['uuid']}", key=loop["uuid"]):
                queue_dir = PROJECT_ROOT / ".cursor"
                queue_dir.mkdir(exist_ok=True)
                with open(queue_dir / "prompt_queue.txt", "a") as f:
                    f.write(f"/promote_loop {loop['uuid']}\\n")
                st.success(f"Loop {loop['uuid']} sent for promotion.")
                st.experimental_rerun() 