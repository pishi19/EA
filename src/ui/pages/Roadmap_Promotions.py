import streamlit as st
import sqlite3
import os
import frontmatter
from pathlib import Path

st.set_page_config(page_title="Promote Loops", layout="wide")
st.header("🔁 Promote Loops to Roadmap")
st.caption("Select loops to promote into active workstream items.")

# ---
# Final, Proven, Linear Logic - No Functions, No Caching
# ---
promotable_loops = []
try:
    # 1. Establish Paths
    PROJECT_ROOT = Path(__file__).resolve().parents[3]
    roadmap_dir = PROJECT_ROOT / "runtime/roadmap"
    db_path = PROJECT_ROOT / "runtime/db/ora.db"
    loops_dir = PROJECT_ROOT / "runtime/loops"

    # 2. Get promoted UUIDs
    promoted_uuids = set()
    if roadmap_dir.exists():
        for fname in os.listdir(roadmap_dir):
            if fname.endswith(".md"):
                try:
                    post = frontmatter.load(roadmap_dir / fname)
                    if "origin_loop" in post:
                        promoted_uuids.add(post["origin_loop"])
                except Exception:
                    continue

    # 3. Get all DB loops that have a workstream
    all_db_loops = []
    if db_path.exists():
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT uuid, title, workstream, score FROM loop_metadata WHERE workstream IS NOT NULL")
        rows = cur.fetchall()
        conn.close()
        all_db_loops = [
            {"uuid": r[0], "title": r[1], "workstream": r[2], "score": r[3]} for r in rows
        ]

    # 4. Find the intersection of DB loops and filesystem loops
    db_loops_with_files = set()
    if loops_dir.exists():
        all_loop_files_by_uuid = {}
        for fname in os.listdir(loops_dir):
            if fname.endswith(".md"):
                try:
                    post = frontmatter.load(loops_dir / fname)
                    if "uuid" in post:
                        all_loop_files_by_uuid[post["uuid"]] = fname
                except Exception:
                    continue
        for loop_data in all_db_loops:
            if loop_data["uuid"] in all_loop_files_by_uuid:
                db_loops_with_files.add(loop_data["uuid"])

    # 5. Final list: intersection minus already promoted
    promotable_loops = [
        loop for loop in all_db_loops 
        if loop["uuid"] in db_loops_with_files and loop["uuid"] not in promoted_uuids
    ]

except Exception as e:
    st.error(f"An error occurred during data loading: {e}")


# --- Final UI Rendering ---
if not promotable_loops:
    st.success("✅ No promotable loops found.")
else:
    st.metric("Loops Ready to Promote", len(promotable_loops))
    for loop in promotable_loops:
        with st.expander(f"{loop['title']} (Workstream: {loop.get('workstream', 'N/A')})"):
            st.markdown(f"**UUID:** `{loop['uuid']}`")
            st.markdown(f"**Score:** `{loop.get('score', 'N/A')}`")
            if st.button("Promote This Loop", key=loop['uuid']):
                st.info("Promotion logic would be triggered here.")
                st.experimental_rerun() 