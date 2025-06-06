import streamlit as st
import pandas as pd
from pathlib import Path
import frontmatter
import sqlite3
import os

from src.agent.commands.promote_loop import promote_loop_to_roadmap

# --- Constants ---
# Use a robust method to find the project root, starting from the CWD
def find_project_root(marker=".git"):
    path = Path.cwd()
    for _ in range(8): # Limit upward search to 8 levels
        if (path / marker).exists():
            return path
        path = path.parent
    # Fallback if CWD is not in the project
    script_path = Path(__file__).resolve()
    for _ in range(8):
        if (script_path / marker).exists():
            return script_path
        script_path = script_path.parent
    raise FileNotFoundError("Project root not found.")

PROJECT_ROOT = find_project_root()
ROADMAP_DIR = PROJECT_ROOT / "runtime/roadmap"
LOOPS_DIR = PROJECT_ROOT / "runtime/loops"


st.set_page_config(page_title="Roadmap Promotions", layout="wide")
st.title("💡 Proposable Loops")
st.caption("Promote high-signal loops to the official roadmap.")


@st.cache_data(ttl=15)
def load_promotable_loops(db_path="runtime/db/ora.db"):
    """
    Finds loops that have a workstream assigned, have a corresponding .md file,
    and have not yet been promoted to a roadmap item.
    """
    # 1. Get all roadmap items that have an origin loop
    promoted_loop_uuids = set()
    if ROADMAP_DIR.exists():
        for md_file in ROADMAP_DIR.glob("*.md"):
            try:
                post = frontmatter.load(md_file)
                if origin_loop := post.get("origin_loop"):
                    promoted_loop_uuids.add(origin_loop)
            except Exception:
                continue

    # 2. Get all loops with a workstream from the database
    try:
        conn = sqlite3.connect(PROJECT_ROOT / db_path)
        loops_df = pd.read_sql(
            "SELECT uuid, title, workstream, score, status FROM loop_metadata WHERE workstream IS NOT NULL",
            conn
        )
        conn.close()
    except Exception as e:
        st.error(f"Failed to load loops from database: {e}")
        return pd.DataFrame()

    # 3. Filter loops using a standard Python loop for robustness
    promotable_rows = []
    for index, row in loops_df.iterrows():
        if row['uuid'] in promoted_loop_uuids:
            continue
        
        # 4. Directly check for the corresponding file's existence
        found_file = False
        if LOOPS_DIR.exists():
            for loop_file in LOOPS_DIR.glob("*.md"):
                try:
                    post = frontmatter.load(loop_file)
                    if post.get("uuid") == row['uuid']:
                        found_file = True
                        break
                except Exception:
                    continue
        
        if found_file:
            promotable_rows.append(row)

    return pd.DataFrame(promotable_rows)

# --- Main UI ---
promotable_loops = load_promotable_loops()

if promotable_loops.empty:
    st.info("✅ No promotable loops found. All recent tasks have been promoted or resolved.")
    # Add a debug section to provide info when the list is empty
    with st.expander("Why might this be empty?"):
        st.markdown(
            """
            This panel shows loops that meet three criteria:
            1.  They exist in the **database** (`loop_metadata` table).
            2.  They have a corresponding **`.md` file** in `runtime/loops/`.
            3.  They have **not** already been promoted to a roadmap item (i.e., no roadmap file lists their UUID as `origin_loop`).

            If a loop you expect to see is missing, it's likely failing one of these checks.
            """
        )
    st.stop()

st.metric("Loops Ready to Promote", len(promotable_loops))

for index, loop in promotable_loops.iterrows():
    st.divider()
    col1, col2 = st.columns([5, 1])
    
    with col1:
        st.subheader(loop['title'])
        st.markdown(f"**Workstream:** `{loop['workstream']}` | **Status:** `{loop['status']}` | **Score:** {loop['score']:.2f if loop['score'] else 'N/A'}")
        st.caption(f"Loop UUID: {loop['uuid']}")

    if col2.button("Promote", key=f"promote_{loop['uuid']}", use_container_width=True):
        with st.spinner("Promoting loop to roadmap..."):
            result = promote_loop_to_roadmap(loop['uuid'])
        
        if result.get("status") == "success":
            st.toast(f"✅ Promoted: {loop['title']}", icon="🚀")
            st.cache_data.clear()
            st.experimental_rerun()
        else:
            st.error(f"Failed to promote: {result.get('error')}") 