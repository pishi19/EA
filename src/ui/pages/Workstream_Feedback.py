import streamlit as st
import sqlite3
import pandas as pd
from pathlib import Path

st.set_page_config(page_title="Workstream Feedback", layout="wide")
st.title("🔎 Workstream Feedback & Volatility")

# ---
# Final, Proven, Linear Logic
# ---
workstreams_df = pd.DataFrame()
loops_df = pd.DataFrame()
feedback_df = pd.DataFrame()

try:
    PROJECT_ROOT = Path(__file__).resolve().parents[3]
    db_path = PROJECT_ROOT / "runtime/db/ora.db"

    if db_path.exists():
        conn = sqlite3.connect(db_path)
        workstreams_df = pd.read_sql("SELECT id, title FROM workstreams", conn)
        loops_df = pd.read_sql("SELECT uuid, title, workstream, score FROM loop_metadata", conn)
        feedback_df = pd.read_sql("SELECT uuid, tag FROM loop_feedback", conn)
        conn.close()
    else:
        st.error("Database file not found.")

except Exception as e:
    st.error(f"A critical error occurred: {e}")

# --- UI Rendering ---
if workstreams_df.empty or loops_df.empty:
    st.warning("No workstreams or loop metadata found in the database. Please ensure data is migrated.")
    st.stop()

# --- UI: Workstream Selector ---
st.sidebar.header("Filters")
stream_titles = ["All Streams"] + workstreams_df['title'].tolist()
selected_stream_title = st.sidebar.selectbox("Select a Workstream", stream_titles)

# --- Data Processing ---
if selected_stream_title != "All Streams":
    selected_stream_id = workstreams_df[workstreams_df['title'] == selected_stream_title]['id'].iloc[0]
    st.header(f"Feedback for: {selected_stream_title}")
    loops_df = loops_df[loops_df['workstream'] == selected_stream_id].copy()
else:
    st.header("Feedback for All Workstreams")

if not feedback_df.empty:
    feedback_counts = feedback_df.groupby('uuid')['tag'].value_counts().unstack(fill_value=0)
    feedback_counts.columns = [f"{col}_count" for col in feedback_counts.columns]
    
    loops_with_feedback = pd.merge(loops_df, feedback_counts, on='uuid', how='left').fillna(0)

    useful = loops_with_feedback.get('useful_count', 0)
    false_positive = loops_with_feedback.get('false_positive_count', 0)
    total_feedback = useful + false_positive
    
    loops_with_feedback['total_feedback'] = total_feedback
    loops_with_feedback['volatility'] = ((useful - false_positive).abs() / total_feedback).fillna(0)
    
    def get_skew(row):
        if row['total_feedback'] == 0: return "No Feedback"
        if row['useful_count'] > row['false_positive_count']: return "Positive"
        if row['false_positive_count'] > row['useful_count']: return "Negative"
        return "Neutral"
    
    loops_with_feedback['skew'] = loops_with_feedback.apply(get_skew, axis=1)
else:
    loops_with_feedback = loops_df.copy()
    loops_with_feedback['total_feedback'] = 0
    loops_with_feedback['volatility'] = 0
    loops_with_feedback['skew'] = "No Feedback"

# --- UI: Filtering & Display ---
score_threshold = st.sidebar.slider("Min Score", 0.0, 1.0, 0.0)
volatility_threshold = st.sidebar.slider("Max Volatility", 0.0, 1.0, 1.0)

filtered_df = loops_with_feedback[
    (loops_with_feedback['score'] >= score_threshold) &
    (loops_with_feedback['volatility'] <= volatility_threshold)
]

def style_skew(series):
    colors = {"Positive": "#2A4B37", "Negative": "#5B2C2E", "Neutral": "#4A4A4A", "No Feedback": "#3E3E3E"}
    return [f"background-color: {colors.get(v, '')}" for v in series]

final_df = filtered_df[['uuid', 'title', 'score', 'total_feedback', 'volatility', 'skew']].rename(
    columns={'uuid': 'UUID', 'title': 'Title', 'score': 'Score', 'total_feedback': 'Feedback Count', 'volatility': 'Volatility', 'skew': 'Feedback Skew'}
)

st.dataframe(final_df.style.apply(style_skew, subset=['Feedback Skew']), use_container_width=True)

st.caption("Further filtering and styling coming soon.") 