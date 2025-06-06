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
    # Fallback for environments where the structure is different
    PROJECT_ROOT = Path.cwd()
# ---

def load_promotable_loops():
    """
    This function implements the full, correct logic verified by the standalone script.
    """
    roadmap_dir = PROJECT_ROOT / "runtime/roadmap"
    db_path = PROJECT_ROOT / "runtime/db/ora.db"
    loops_dir = PROJECT_ROOT / "runtime/loops"

    # 1. Get promoted UUIDs
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

    # 2. Get all loops from the database that have a workstream
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

    # 3. Find which of those DB loops have a matching .md file
    loops_with_files = []
    if loops_dir.exists():
        for loop_data in all_db_loops:
            # This is the crucial missing step:
            for fname in os.listdir(loops_dir):
                if fname.endswith(".md"):
                    try:
                        post = frontmatter.load(loops_dir / fname)
                        if post.get("uuid") == loop_data["uuid"]:
                            loops_with_files.append(loop_data)
                            break
                    except Exception:
                        continue
    
    # 4. Filter out any that are already promoted
    final_list = [loop for loop in loops_with_files if loop["uuid"] not in promoted]
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