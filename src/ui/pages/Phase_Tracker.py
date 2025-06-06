from pathlib import Path

import pandas as pd
import streamlit as st
import yaml

st.set_page_config(page_title="Phase Tracker", layout="wide")
st.title("🛤️ Phase Execution Tracker")
st.caption("A log of all successfully executed Ora Phases.")

# --- Pathing ---
try:
    PROJECT_ROOT = Path(__file__).resolve().parents[3]
except IndexError:
    PROJECT_ROOT = Path.cwd()

log_file = PROJECT_ROOT / "runtime/phase_execution_log.yaml"

# --- Data Loading ---
if not log_file.exists():
    st.error("`runtime/phase_execution_log.yaml` not found.")
    st.stop()

with open(log_file) as f:
    log_data = yaml.safe_load(f)

if not log_data or not isinstance(log_data, list):
    st.warning("No phase execution data found in the log file.")
    st.stop()

# --- UI Rendering ---
df = pd.DataFrame(log_data)

# Reorder columns for better readability
cols = ['phase', 'action', 'result', 'timestamp', 'note']
# Ensure all columns exist, fill missing with None
for col in cols:
    if col not in df.columns:
        df[col] = None
df = df[cols]

# Reverse the dataframe to show the latest entries first
df = df.iloc[::-1]

st.dataframe(df, use_container_width=True)
