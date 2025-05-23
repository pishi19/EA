#!/bin/bash

# Usage: ./log_cursor_edit.sh "/path/to/file.py" "Refactored something important"
# Appends a formatted log entry to system-log.md

LOG_FILE="/Users/air/AIR01/System/Logs/system-log.md"

if [ $# -ne 2 ]; then
  echo "Usage: $0 <file_path> <summary>"
  exit 1
fi

FILE_PATH=$1
SUMMARY=$2
TIMESTAMP=$(date +"%Y-%m-%dT%H:%M")

echo "## ${TIMESTAMP} — Cursor Edit" >> "$LOG_FILE"
echo "🔧 Modified: ${FILE_PATH}" >> "$LOG_FILE"
echo "🎯 Change: ${SUMMARY}" >> "$LOG_FILE"
echo "🧪 Status: Draft" >> "$LOG_FILE"
echo "👀 Context: Cursor inline GPT" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

echo "✅ Logged to system-log.md"
