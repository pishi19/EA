import streamlit as st
import sqlite3
import pandas as pd
import re

st.set_page_config(page_title="Workstream Feedback", layout="wide")
st.title("🔎 Workstream Feedback & Volatility")

# --- Database Connection ---
@st.cache_resource
def get_db_connection(db_path="runtime/db/ora.db"):
    """Creates a connection to the SQLite database."""
    return sqlite3.connect(db_path, check_same_thread=False)

@st.cache_data(ttl=60)
def load_data(_conn):
    """Loads all necessary data from the database."""
    try:
        workstreams = pd.read_sql("SELECT * FROM workstreams", _conn)
        loops = pd.read_sql("SELECT * FROM loop_metadata", _conn)
        feedback = pd.read_sql("SELECT * FROM loop_feedback", _conn)
        return workstreams, loops, feedback
    except pd.io.sql.DatabaseError as e:
        st.error(f"Database query failed: {e}. Has the schema been updated for this phase?")
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

conn = get_db_connection()
workstreams_df, loops_df, feedback_df = load_data(conn)

if workstreams_df.empty or loops_df.empty:
    st.warning("No workstreams or loop metadata found in the database. Please ensure data is migrated.")
    st.stop()

# --- UI: Workstream Selector ---
st.sidebar.header("Filters")
stream_titles = ["All Streams"] + workstreams_df['title'].tolist()
selected_stream_title = st.sidebar.selectbox(
    "Select a Workstream",
    stream_titles
)

# --- Data Processing ---
# Filter by selected workstream
if selected_stream_title == "All Streams":
    selected_stream_id = None
    st.header("Feedback for All Workstreams")
else:
    selected_stream_id = workstreams_df[workstreams_df['title'] == selected_stream_title]['id'].iloc[0]
    st.header(f"Feedback for: {selected_stream_title}")
    loops_df = loops_df[loops_df['workstream'] == selected_stream_id].copy()

if not feedback_df.empty:
    # Calculate feedback counts
    feedback_counts = feedback_df.groupby('uuid')['tag'].value_counts().unstack(fill_value=0)
    feedback_counts.columns = [f"{col}_count" for col in feedback_counts.columns]
    
    # Merge feedback counts with loops
    loops_with_feedback = pd.merge(loops_df, feedback_counts, on='uuid', how='left').fillna(0)

    # Calculate volatility and other metrics
    useful = loops_with_feedback.get('useful_count', pd.Series(0, index=loops_with_feedback.index))
    false_positive = loops_with_feedback.get('false_positive_count', pd.Series(0, index=loops_with_feedback.index))
    total_feedback = useful + false_positive
    
    loops_with_feedback['total_feedback'] = total_feedback
    loops_with_feedback['volatility'] = ((useful - false_positive).abs() / total_feedback).fillna(0)
    
    # Define feedback skew for color coding
    def get_skew(row):
        if row['total_feedback'] == 0:
            return "No Feedback"
        if row['useful_count'] > row['false_positive_count']:
            return "Positive"
        if row['false_positive_count'] > row['useful_count']:
            return "Negative"
        return "Neutral"
    
    loops_with_feedback['skew'] = loops_with_feedback.apply(get_skew, axis=1)

else:
    loops_with_feedback = loops_df.copy()
    loops_with_feedback['total_feedback'] = 0
    loops_with_feedback['volatility'] = 0
    loops_with_feedback['skew'] = "No Feedback"

# --- UI: Filtering Controls ---
score_threshold = st.sidebar.slider("Score Threshold", 0.0, 1.0, 0.0, 0.05)
volatility_threshold = st.sidebar.slider("Volatility Threshold", 0.0, 1.0, 1.0, 0.05)

# Apply filters
filtered_df = loops_with_feedback[
    (loops_with_feedback['score'] >= score_threshold) &
    (loops_with_feedback['volatility'] <= volatility_threshold)
]

# --- UI: Display Table ---
st.metric("Displaying Loops", len(filtered_df))

def style_skew(series):
    """Applies color styling based on feedback skew."""
    color_map = {
        "Positive": "background-color: #2A4B37", # dark green
        "Negative": "background-color: #5B2C2E", # dark red
        "Neutral": "background-color: #4A4A4A", # dark grey
        "No Feedback": "background-color: #3E3E3E" # darker grey
    }
    return [color_map.get(v, "") for v in series]

final_df = filtered_df[[
    'uuid', 'title', 'score', 'status', 
    'total_feedback', 'volatility', 'skew'
]].copy()

final_df.rename(columns={
    'total_feedback': 'Feedback Count',
    'volatility': 'Volatility',
    'skew': 'Feedback Skew',
    'score': 'Score',
    'title': 'Title',
    'status': 'Status',
    'uuid': 'UUID'
}, inplace=True)


st.dataframe(
    final_df.style.apply(style_skew, subset=['Feedback Skew']),
    use_container_width=True,
    height=600
)

st.caption("Further filtering and styling coming soon.") 