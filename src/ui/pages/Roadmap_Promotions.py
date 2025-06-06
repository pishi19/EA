import streamlit as st
import pandas as pd
from pathlib import Path
import frontmatter
import sqlite3

# Import the promotion function and the file finder
from src.agent.commands.promote_loop import promote_loop_to_roadmap, find_loop_file_by_uuid

st.set_page_config(page_title="Roadmap Promotions", layout="wide")
st.title("💡 Proposable Loops")
st.caption("Promote high-signal loops to the official roadmap.")

ROADMAP_DIR = Path("runtime/roadmap")

@st.cache_data(ttl=30)
def load_promotable_loops(db_path="runtime/db/ora.db"):
    """
    Finds loops that have a workstream assigned but have not yet been
    promoted to a roadmap item.
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
                continue # Ignore malformed files

    # 2. Get all loops with a workstream from the database
    try:
        conn = sqlite3.connect(db_path)
        loops_df = pd.read_sql(
            "SELECT uuid, title, workstream, score, status FROM loop_metadata WHERE workstream IS NOT NULL",
            conn
        )
        conn.close()
    except Exception as e:
        st.error(f"Failed to load loops from database: {e}")
        return pd.DataFrame()

    # 3. Filter out loops that have already been promoted
    if not loops_df.empty:
        unpromoted_df = loops_df[~loops_df['uuid'].isin(promoted_loop_uuids)].copy()
        
        # 4. Ensure a source .md file exists for the loop to be promotable
        unpromoted_df['file_exists'] = unpromoted_df['uuid'].apply(
            lambda uuid: find_loop_file_by_uuid(uuid) is not None
        )
        return unpromoted_df[unpromoted_df['file_exists']]
    
    return pd.DataFrame()

# --- Main UI ---
promotable_loops = load_promotable_loops()

if promotable_loops.empty:
    st.success("✅ No promotable loops found. All recent tasks have been promoted or resolved.")
    st.stop()

st.metric("Loops Ready to Promote", len(promotable_loops))

for index, loop in promotable_loops.iterrows():
    st.divider()
    col1, col2 = st.columns([5, 1])
    
    with col1:
        st.subheader(loop['title'])
        st.markdown(f"**Workstream:** `{loop['workstream']}` | **Status:** `{loop['status']}` | **Score:** {loop['score']:.2f}")
        st.caption(f"Loop UUID: {loop['uuid']}")

    if col2.button("Promote", key=f"promote_{loop['uuid']}", use_container_width=True):
        with st.spinner("Promoting loop to roadmap..."):
            result = promote_loop_to_roadmap(loop['uuid'])
        
        if result.get("status") == "success":
            st.toast(f"✅ Promoted: {loop['title']}", icon="🚀")
            # Clear cache and rerun to refresh the list
            st.cache_data.clear()
            st.experimental_rerun()
        else:
            st.error(f"Failed to promote: {result.get('error')}") 