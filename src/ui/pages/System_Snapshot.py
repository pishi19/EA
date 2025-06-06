import os
import sqlite3
from pathlib import Path

import streamlit as st

st.set_page_config(page_title="System Snapshot", layout="wide")
st.title("📸 System Snapshot")
st.caption("A high-level overview of the current system state.")

# --- Pathing ---
try:
    PROJECT_ROOT = Path(__file__).resolve().parents[3]
except IndexError:
    PROJECT_ROOT = Path.cwd()

db_path = PROJECT_ROOT / "runtime/db/ora.db"
loops_dir = PROJECT_ROOT / "runtime/loops"
roadmap_dir = PROJECT_ROOT / "runtime/roadmap"

# --- Database Stats ---
st.subheader("Database Metrics")
db_stats = {}
if db_path.exists():
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    tables = ["workstreams", "loop_metadata", "loop_feedback", "tasks"]
    for table in tables:
        try:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            count = cur.fetchone()[0]
            db_stats[table] = count
        except sqlite3.OperationalError:
            db_stats[table] = "Not Found"
    conn.close()
else:
    st.warning("Database file not found.")

if db_stats:
    cols = st.columns(len(db_stats))
    for i, (table, count) in enumerate(db_stats.items()):
        cols[i].metric(table.replace("_", " ").title(), count)

st.divider()

# --- Filesystem Stats ---
st.subheader("Filesystem State")
col1, col2 = st.columns(2)

with col1:
    st.write(f"#### Loops (`{loops_dir.relative_to(PROJECT_ROOT)}`)")
    if loops_dir.exists():
        loop_files = [f for f in os.listdir(loops_dir) if f.endswith(".md")]
        st.code(f"{len(loop_files)} files found.")
        with st.expander("View Files"):
            st.code("\n".join(loop_files))
    else:
        st.warning("Directory not found.")

with col2:
    st.write(f"#### Roadmap (`{roadmap_dir.relative_to(PROJECT_ROOT)}`)")
    if roadmap_dir.exists():
        roadmap_files = [f for f in os.listdir(roadmap_dir) if f.endswith(".md")]
        st.code(f"{len(roadmap_files)} files found.")
        with st.expander("View Files"):
            st.code("\n".join(roadmap_files))
    else:
        st.warning("Directory not found.")
