import streamlit as st
import pandas as pd
from pathlib import Path
import frontmatter
import re
import sqlite3

st.set_page_config(page_title="Workstream View", layout="wide")
st.title("🔎 Workstream View")

# --- Data Loading ---

@st.cache_data
def load_workstreams_from_db():
    conn = sqlite3.connect("runtime/db/ora.db")
    # Set row_factory to access columns by name
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT id, title, tags, goals, owners FROM workstreams")
    rows = cur.fetchall()
    conn.close()

    # Process rows into a list of dictionaries
    workstreams = []
    for row in rows:
        workstreams.append({
            "id": row["id"],
            "title": row["title"],
            "tags": row["tags"].split(",") if row["tags"] else [],
            "goals": row["goals"].split(", ") if row["goals"] else [],
            "owners": row["owners"].split(",") if row["owners"] else []
        })
    return workstreams

@st.cache_data
def load_feedback_scores():
    """Loads feedback scores from a YAML file."""
    feedback_file = Path("src/data/feedback_scores.yaml")
    if not feedback_file.exists():
        return {}
    with open(feedback_file, "r") as f:
        scores_list = yaml.safe_load(f)
        return {item['uuid']: item for item in scores_list} if scores_list else {}

@st.cache_data
def load_all_loops(feedback_scores):
    """Loads all loop files and merges feedback and task data."""
    loop_dir = Path("runtime/loops")
    if not loop_dir.exists():
        st.warning("`runtime/loops` directory not found.")
        return []
    
    loops = []
    for loop_file in loop_dir.glob("*.md"):
        try:
            post = frontmatter.load(loop_file)
            metadata = post.metadata
            loop_uuid = metadata.get("uuid")
            feedback_data = feedback_scores.get(loop_uuid, {})

            loops.append({
                "uuid": loop_uuid or "N/A",
                "title": metadata.get("title", "Untitled"),
                "phase": metadata.get("phase", "N/A"),
                "workstream": metadata.get("workstream", "Unassigned"),
                "status": metadata.get("status", "unknown"),
                "tags": metadata.get("tags", []),
                "feedback_score": feedback_data.get('score'),
                "source": metadata.get('source') or metadata.get('gmail_message_id'),
                "content": post.content,
                "file": loop_file.name
            })
        except Exception as e:
            st.error(f"Error loading or parsing {loop_file.name}: {e}")
    return loops

workstreams = load_workstreams_from_db()
feedback_scores = load_feedback_scores()
all_loops = load_all_loops(feedback_scores)

if not workstreams:
    st.info("No workstreams found in the database.")
    st.stop()

# --- UI Display ---

titles = [ws["title"] for ws in workstreams]
selected_title = st.selectbox(
    "Choose a Workstream",
    options=titles
)

st.divider()

if selected_title:
    selected_ws = next((ws for ws in workstreams if ws["title"] == selected_title), None)

    if selected_ws:
        # Filter loops for the selected workstream
        assigned_loops = [loop for loop in all_loops if loop["workstream"] == selected_ws["id"]]
        
        st.write("### Goals")
        for goal in selected_ws["goals"]:
            st.markdown(f"- {goal}")

        st.write("### Owners")
        st.markdown(", ".join(selected_ws["owners"]))
        
        st.divider()
        st.write("### Assigned Loops")

        if not assigned_loops:
            st.warning(f"No loops found for the '{selected_ws['title']}' workstream.")
        else:
            # --- Display Loops Iteratively ---
            for loop in assigned_loops:
                with st.container():
                    col1, col2 = st.columns([4, 1])
                    with col1:
                        st.subheader(loop['title'])
                        tags_html = " ".join([f"`{tag}`" for tag in loop.get('tags', [])])
                        st.markdown(f"**Phase:** {loop['phase']} | **Status:** `{loop['status'].upper()}` | **Tags:** {tags_html}")

                    with col2:
                        score = loop.get('feedback_score')
                        if score is not None:
                            st.metric("Feedback Score", f"{score:.2f}")
                        else:
                            st.metric("Feedback Score", "N/A")

                    # Content Excerpt and Links
                    with st.expander("Details & Actions"):
                        st.markdown("##### Loop Content")
                        st.info(loop['content'] if loop['content'].strip() else "*No content found.*")
                        
                        source_link = loop.get('source')
                        if source_link:
                            st.markdown(f"🔗 **[View Source]({source_link})**")
                        
                        st.markdown("---")
                        st.markdown("##### Actions")
                        b1, b2, b3 = st.columns(3)
                        b1.button("Mark Complete", key=f"complete_{loop['uuid']}", use_container_width=True)
                        b2.button("Assign Owner", key=f"assign_{loop['uuid']}", use_container_width=True)
                        b3.button("Flag for Review", key=f"flag_{loop['uuid']}", use_container_width=True)

                    st.divider()
else:
    st.info("Select a workstream to view its loops.")

st.caption("End of workstream view.") 