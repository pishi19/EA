import sys
from pathlib import Path

# Add project root to the Python path BEFORE any other imports
# This ensures that `from src...` works correctly.
try:
    PROJECT_ROOT = Path(__file__).resolve().parents[3]
    sys.path.append(str(PROJECT_ROOT))
except IndexError:
    # If the structure is different, fallback to current dir, but this might fail.
    PROJECT_ROOT = Path.cwd()
    sys.path.append(str(PROJECT_ROOT))

import streamlit as st
import sqlite3
import os
import frontmatter
from src.agent.commands.promote_loop import promote_loop_to_roadmap

st.set_page_config(page_title="Promote Loops", layout="wide")

# --- Final, Correct Implementation ---
try:
    ROADMAP_DIR = PROJECT_ROOT / "runtime" / "roadmap"
    DB_PATH = PROJECT_ROOT / "runtime" / "db" / "ora.db"
    LOOPS_DIR = PROJECT_ROOT / "runtime" / "loops"

    # Load promoted UUIDs
    promoted_loop_uuids = set()
    if ROADMAP_DIR.exists():
        for fname in os.listdir(ROADMAP_DIR):
            if fname.endswith(".md"):
                try:
                    post = frontmatter.load(ROADMAP_DIR / fname)
                    if "origin_loop" in post:
                        promoted_loop_uuids.add(post["origin_loop"])
                except Exception:
                    pass
    
    # Load all loops from DB
    all_loops = []
    if DB_PATH.exists():
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT uuid, title, workstream, score FROM loop_metadata")
        rows = cur.fetchall()
        conn.close()
        all_loops = [
            {"uuid": r[0], "title": r[1], "workstream": r[2], "score": r[3]}
            for r in rows
            if r[2]  # must have a workstream
        ]

    # Filter for loops that exist in the filesystem and are not promoted
    promotable_loops = []
    if LOOPS_DIR.exists():
        all_loop_files_by_uuid = {}
        for f in os.listdir(LOOPS_DIR):
            if f.endswith(".md"):
                try:
                    post = frontmatter.load(LOOPS_DIR / f)
                    if "uuid" in post:
                        all_loop_files_by_uuid[post.get("uuid")] = f
                except Exception:
                    continue
        
        for loop in all_loops:
            if loop["uuid"] in all_loop_files_by_uuid and loop["uuid"] not in promoted_loop_uuids:
                promotable_loops.append(loop)

    # --- UI Rendering ---
    st.header("🔁 Promote Loops to Roadmap")

    if not promotable_loops:
        st.success("✅ No promotable loops found. All have been promoted.")
    else:
        st.metric("Loops Ready to Promote", len(promotable_loops))
        for loop in promotable_loops:
            with st.expander(f"{loop['title']} (Workstream: {loop.get('workstream', 'N/A')})"):
                st.markdown(f"**UUID:** `{loop['uuid']}`")
                st.markdown(f"**Workstream:** `{loop['workstream']}`")
                st.markdown(f"**Score:** `{loop.get('score', 'N/A')}`")
                if st.button("Promote", key=loop["uuid"]):
                    with st.spinner("Promoting loop..."):
                        result = promote_loop_to_roadmap(loop["uuid"])
                    if result.get("status") == "success":
                        st.success(f"Loop promoted! New file at: {result.get('file_path')}")
                        st.experimental_rerun()
                    else:
                        st.error(f"Promotion failed: {result.get('error')}")

except Exception as e:
    st.error("A critical error occurred while loading the page.")
    st.exception(e) 