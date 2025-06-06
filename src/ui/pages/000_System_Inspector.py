import os
import sqlite3
import stat
import sys
from pathlib import Path

import streamlit as st

st.set_page_config(page_title="System Inspector", layout="wide")
st.header("🕵️‍♂️ System-Level Inspector")
st.warning("This page is a diagnostic tool to understand the Streamlit execution environment.")

# --- System Info ---
st.subheader("1. Environment Details")
st.code(f"Python Version: {sys.version}")
st.code(f"Streamlit Version: {st.__version__}")
st.code(f"Current Working Directory (CWD): {Path.cwd()}")
st.code(f"Script Location (__file__): {Path(__file__).resolve()}")

# --- Path Resolution ---
st.subheader("2. Path Resolution")
try:
    project_root = Path(__file__).resolve().parents[3]
    st.info(f"**Project Root Found:** `{project_root}`")
except IndexError:
    st.error("Could not find project root via `parents[3]`. The file structure may be incorrect.")
    st.stop()

db_path = project_root / "runtime/db/ora.db"
loops_dir = project_root / "runtime/loops"
roadmap_dir = project_root / "runtime/roadmap"

# --- Directory and File Inspection ---
st.subheader("3. File System State")
paths_to_check = {
    "Project Root": project_root,
    "Loops Dir": loops_dir,
    "Roadmap Dir": roadmap_dir,
    "Database File": db_path
}

for name, path in paths_to_check.items():
    with st.expander(f"Inspecting: {name} (`{path}`)", expanded=True):
        st.write(f"**Exists:** {path.exists()}")
        if path.exists():
            try:
                mode = path.stat().st_mode
                st.write(f"**Permissions:** `{stat.filemode(mode)}`")
                if path.is_dir():
                    st.write(f"**Contents ({len(os.listdir(path))} items):**")
                    st.code(os.listdir(path))
                else: # is a file
                    st.write(f"**Size:** {path.stat().st_size} bytes")
            except Exception as e:
                st.error(f"Could not inspect path: {e}")
        else:
            st.warning("Path does not exist.")

# --- Database Connectivity ---
st.subheader("4. Database Connectivity & Content")
if db_path.exists():
    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        cur = conn.cursor()
        cur.execute("SELECT uuid, title, workstream FROM loop_metadata WHERE workstream IS NOT NULL")
        rows = cur.fetchall()
        conn.close()
        st.success(f"Successfully connected to DB and fetched {len(rows)} loops.")
        st.dataframe([dict(uuid=r[0], title=r[1], workstream=r[2]) for r in rows])
    except Exception as e:
        st.error(f"Database connection or query failed: {e}")
else:
    st.error("Cannot connect to database because the file does not exist.")

st.info("Please copy and paste the entire output of this page to the chat.")
