import streamlit as st
import sqlite3
import os
import frontmatter
from pathlib import Path

st.set_page_config(page_title="Promote Loops", layout="wide")
st.header("🔁 Promote Loops to Roadmap")
st.caption("Select loops to promote into active workstream items.")

# --- Correct, Robust Pathing ---
try:
    PROJECT_ROOT = Path(__file__).resolve().parents[3]
except IndexError:
    PROJECT_ROOT = Path.cwd()

def load_promotable_loops():
    """
    This function finds loops that exist in BOTH the filesystem and the database,
    and have not yet been promoted. This is the corrected logic.
    """
    roadmap_dir = PROJECT_ROOT / "runtime/roadmap"
    db_path = PROJECT_ROOT / "runtime/db/ora.db"
    loops_dir = PROJECT_ROOT / "runtime/loops"

    # 1. Get all loop UUIDs from the filesystem
    filesystem_loops = {}
    if loops_dir.exists():
        for fname in os.listdir(loops_dir):
            if fname.endswith(".md"):
                try:
                    post = frontmatter.load(loops_dir / fname)
                    if "uuid" in post:
                        filesystem_loops[post["uuid"]] = post.get("title", "Untitled")
                except Exception:
                    continue
    
    # 2. Get all promotable loops from the database (have a workstream)
    db_loops = {}
    if db_path.exists():
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT uuid, title, workstream, score FROM loop_metadata WHERE workstream IS NOT NULL")
        rows = cur.fetchall()
        conn.close()
        for r in rows:
            db_loops[r[0]] = {"title": r[1], "workstream": r[2], "score": r[3]}

    # 3. Find the intersection: loops that are in both the DB and the filesystem
    valid_loop_uuids = set(filesystem_loops.keys()) & set(db_loops.keys())

    # 4. Get promoted UUIDs
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

    # 5. Final list: intersection minus already promoted loops
    final_list = []
    for uuid in valid_loop_uuids:
        if uuid not in promoted_uuids:
            # Combine data from DB for the final list
            loop_data = db_loops[uuid]
            loop_data['uuid'] = uuid
            final_list.append(loop_data)
            
    return final_list

# --- Main UI Rendering ---
promotable_loops = load_promotable_loops()

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