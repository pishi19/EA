import streamlit as st
import sqlite3
import os
import frontmatter
from pathlib import Path

st.set_page_config(page_title="Promote Loops", layout="wide")
st.header("🔁 Promote Loops to Roadmap")
st.caption("Select loops to promote into active workstream items.")

# ---
# Standalone Logic, adapted for Streamlit
# This is a direct translation of the successful `verify_promotions_standalone.py`
# ---

# Step 1: Find project root
try:
    # This path is relative to this file's location in src/ui/pages/
    project_root = Path(__file__).resolve().parents[3]
except Exception:
    st.error("Fatal Error: Could not determine project root. The file structure may have changed.")
    st.stop()

roadmap_dir = project_root / "runtime/roadmap"
db_path = project_root / "runtime/db/ora.db"
loops_dir = project_root / "runtime/loops"

# Step 2: Load promoted UUIDs
promoted = set()
if roadmap_dir.exists():
    for fname in os.listdir(roadmap_dir):
        if fname.endswith(".md"):
            try:
                post = frontmatter.load(roadmap_dir / fname)
                if "origin_loop" in post:
                    promoted.add(post["origin_loop"])
            except Exception:
                continue

# Step 3: Load all loops with workstreams from database
all_loops_from_db = []
if db_path.exists():
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT uuid, title, workstream, score FROM loop_metadata WHERE workstream IS NOT NULL")
    rows = cur.fetchall()
    conn.close()
    all_loops_from_db = [
        {"uuid": r[0], "title": r[1], "workstream": r[2], "score": r[3]} for r in rows
    ]

# Step 4: Filter for promotable loops (not promoted and file exists)
promotable_loops = []
if loops_dir.exists():
    for loop in all_loops_from_db:
        if loop["uuid"] not in promoted:
            # Check if a corresponding file exists for this loop UUID
            for fname in os.listdir(loops_dir):
                if fname.endswith(".md"):
                    try:
                        post = frontmatter.load(loops_dir / fname)
                        if post.get("uuid") == loop["uuid"]:
                            promotable_loops.append(loop)
                            break # Found the file, move to the next loop
                    except Exception:
                        continue

# --- Final UI Rendering ---
if not promotable_loops:
    st.success("✅ No promotable loops found.")
    with st.expander("Why is this list empty?"):
        st.code(f"Project Root: {project_root}")
        st.code(f"Loops in DB: {len(all_loops_from_db)}")
        st.code(f"Already Promoted: {len(promoted)}")
        st.code(f"Promotable: {len(promotable_loops)}")
else:
    st.metric("Loops Ready to Promote", len(promotable_loops))
    for loop in promotable_loops:
        with st.expander(f"{loop['title']} (Workstream: {loop.get('workstream', 'N/A')})"):
            st.markdown(f"**UUID:** `{loop['uuid']}`")
            st.markdown(f"**Score:** `{loop.get('score', 'N/A')}`")
            if st.button("Promote This Loop", key=loop['uuid']):
                st.info("Promotion logic would be triggered here.")
                st.experimental_rerun() 