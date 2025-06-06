import json
import os
import sqlite3
import subprocess
import sys
from pathlib import Path

import pandas as pd
import streamlit as st
import yaml

DB_PATH = "runtime/db/feedback.db"
LOOP_DIR = Path("runtime/loops")

def load_scores_from_sqlite():
    if not os.path.exists(DB_PATH):
        # This is handled more gracefully in the main app render function
        return pd.DataFrame()
    try:
        conn = sqlite3.connect(DB_PATH)
        query = "SELECT uuid, score, tag_counts FROM loop_scores ORDER BY score DESC"
        df = pd.read_sql_query(query, conn)
        conn.close()
        return df
    except sqlite3.OperationalError:
        # Handled in main app render
        return pd.DataFrame()
    except Exception:
        # Handled in main app render
        return pd.DataFrame()

def parse_frontmatter(file_content: str) -> dict | None:
    """Parses YAML frontmatter from a file's content string."""
    try:
        if not file_content.startswith("---"): return None
        parts = file_content.split("---", 2)
        if len(parts) < 3: return None
        frontmatter = yaml.safe_load(parts[1])
        return frontmatter if isinstance(frontmatter, dict) else None
    except yaml.YAMLError:
        return None

def load_loop_content_by_uuid(uuid: str) -> str:
    """Efficiently finds and loads the full content of a loop file by its UUID."""
    for file_path in LOOP_DIR.glob("loop-*.md"):
        content = file_path.read_text(encoding="utf-8")
        frontmatter = parse_frontmatter(content)
        if frontmatter and str(frontmatter.get("uuid", "")).strip() == uuid.strip():
            return content
    return "⚠️ Loop file not found or UUID mismatch."

def render_loop_dashboard():
    st.set_page_config(page_title="Ora Feedback Dashboard", layout="wide")
    st.title("🔁 Ora Feedback Dashboard (SQL-backed)")

    # --- Sync Button ---
    if st.button("🔄 Sync Feedback from Loop Files"):
        script_path = "scripts/sync_feedback_to_sqlite.py"
        if not os.path.exists(script_path):
            st.error(f"Sync script not found at '{script_path}'")
        else:
            with st.spinner(f"Running `{sys.executable} {script_path}`..."):
                result = subprocess.run([sys.executable, script_path], capture_output=True, text=True)
                if result.returncode == 0:
                    st.success("Feedback sync complete! The dashboard will now reload with updated data.")
                    st.rerun()
                else:
                    st.error("Sync script failed to execute.")
                    st.code(result.stderr, language="bash")

    st.markdown("---")

    df = load_scores_from_sqlite()
    if df.empty:
        st.warning("No loop feedback scores available in the database.")
        st.caption(f"You may need to run the sync script. Click the button above or run `python {os.path.normpath('scripts/sync_feedback_to_sqlite.py')}` in your terminal.")
        return

    # --- Data Preparation ---
    try:
        df["tag_counts_dict"] = df["tag_counts"].apply(json.loads)
        df["tag_counts_clean"] = df["tag_counts"].apply(
            lambda x: str(x).replace("{", "").replace("}", "").replace("'", "").replace('"',"").replace(", ", ", ")
        )
    except json.JSONDecodeError as e:
        st.error(f"Failed to parse 'tag_counts' data from the database: {e}")
        return

    # --- Filtering UI ---
    st.header("Filter & Preview")
    col1, col2 = st.columns(2)
    with col1:
        min_score, max_score = int(df["score"].min()), int(df["score"].max())
        if min_score < max_score:
            score_threshold = st.slider("Minimum Feedback Score", min_score, max_score, min_score)
        else:
            st.write("**Score Filter**")
            st.info(f"All items have the same score: {min_score}")
            score_threshold = min_score

    with col2:
        all_tags = sorted(set(tag for d in df["tag_counts_dict"] for tag in d.keys()))
        tag_filter = st.selectbox("Filter by Tag", ["(All)"] + all_tags)

    # --- Apply Filters ---
    filtered_df = df[df["score"] >= score_threshold]
    if tag_filter != "(All)":
        filtered_df = filtered_df[filtered_df["tag_counts_dict"].apply(lambda tags: tag_filter in tags)]

    # --- Display Table and Drilldown ---
    st.dataframe(
        filtered_df[["uuid", "score", "tag_counts_clean"]].rename(columns={"tag_counts_clean": "tag_counts"}),
        use_container_width=True
    )

    if not filtered_df.empty:
        selected_uuid = st.selectbox("Select a loop to preview its content:", options=filtered_df["uuid"].tolist())
        if selected_uuid:
            st.subheader(f"📄 Loop File Preview: `{selected_uuid}`")
            st.code(load_loop_content_by_uuid(selected_uuid), language="markdown")
    else:
        st.info("No loops match the current filter settings.")

if __name__ == "__main__":
    render_loop_dashboard()
