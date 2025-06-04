#!/bin/bash
cd $(dirname "$0")

# Load .env file if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Ensure logs directory exists
mkdir -p logs

# Restart Ora
pkill -f streamlit || true
nohup streamlit run src/cursor_dashboard.py > logs/streamlit.log 2>&1 & 