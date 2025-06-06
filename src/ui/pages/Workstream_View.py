import streamlit as st
import sqlite3
import os
import frontmatter
from pathlib import Path

st.set_page_config(page_title="Workstream View", layout="wide")
st.title("🔎 Workstream View")

# ---
# Final, Proven, Linear Logic
# ---
workstreams = []
all_loops = []

try:
    PROJECT_ROOT = Path(__file__).resolve().parents[3]
    db_path = PROJECT_ROOT / "runtime/db/ora.db"
    loops_dir = PROJECT_ROOT / "runtime/loops"

    # 1. Load Workstreams from DB
    if db_path.exists():
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT id, title, tags, goals, owners FROM workstreams")
        rows = cur.fetchall()
        conn.close()
        workstreams = [
            {"id": r[0], "title": r[1], "tags": r[2], "goals": r[3], "owners": r[4]}
            for r in rows
        ]

    # 2. Load all loops from filesystem
    if loops_dir.exists():
        for fname in os.listdir(loops_dir):
            if fname.endswith(".md"):
                try:
                    post = frontmatter.load(loops_dir / fname)
                    metadata = post.metadata
                    all_loops.append({
                        "uuid": metadata.get("uuid"),
                        "title": metadata.get("title", "Untitled"),
                        "workstream": metadata.get("workstream"),
                        "status": metadata.get("status", "unknown"),
                        "tags": metadata.get("tags", []),
                        "content": post.content
                    })
                except Exception:
                    continue

except Exception as e:
    st.error(f"A critical error occurred: {e}")

# --- UI Rendering ---
if not workstreams:
    st.info("No workstreams found in the database.")
    st.stop()

titles = [ws["title"] for ws in workstreams]
selected_title = st.selectbox("Choose a Workstream", titles)

if selected_title:
    selected_ws = next((ws for ws in workstreams if ws["title"] == selected_title), None)
    
    if selected_ws:
        st.divider()
        st.write(f"### Goals for {selected_ws['title']}")
        # Goals are stored as a string, need to be split
        goals = selected_ws.get("goals", "").split(", ")
        for goal in goals:
            if goal: st.markdown(f"- {goal}")
        
        st.divider()
        st.write("### Assigned Loops")
        assigned_loops = [loop for loop in all_loops if loop.get("workstream") == selected_ws["id"]]
        
        if not assigned_loops:
            st.warning("No loops found for this workstream.")
        else:
            for loop in assigned_loops:
                with st.container():
                    st.subheader(loop['title'])
                    tags_html = " ".join([f"`{tag}`" for tag in loop.get('tags', [])])
                    st.markdown(f"**Status:** `{loop['status'].upper()}` | **Tags:** {tags_html}")
                    with st.expander("Details"):
                        st.markdown(loop['content'])
                    st.divider()
    else:
        st.error("Could not find the selected workstream data.")
else:
    st.info("Select a workstream to view details.")

st.caption("End of workstream view.") 