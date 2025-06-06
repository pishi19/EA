import sys
from pathlib import Path

import streamlit as st

# Add project root for imports
try:
    PROJECT_ROOT = Path(__file__).resolve().parents[3]
    sys.path.append(str(PROJECT_ROOT))
except IndexError:
    PROJECT_ROOT = Path.cwd()
    sys.path.append(str(PROJECT_ROOT))

from src.data.ui_loaders import load_workstream_view_data

st.set_page_config(page_title="Workstream View", layout="wide")
st.title("🔎 Workstream View")

# --- Data Loading ---
try:
    workstreams, all_loops = load_workstream_view_data(
        db_path=PROJECT_ROOT / "runtime/db/ora.db",
        loops_dir=PROJECT_ROOT / "runtime/loops"
    )
except Exception as e:
    st.error(f"A critical error occurred: {e}")
    workstreams, all_loops = [], []

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
                    st.markdown(f"**Status:** `{loop.get('status', 'unknown').upper()}` | **Tags:** {tags_html}")
                    with st.expander("Details"):
                        st.markdown(loop['content'])
                    st.divider()
    else:
        st.error("Could not find the selected workstream data.")
else:
    st.info("Select a workstream to view details.")

st.caption("End of workstream view.")
