#!/bin/bash

WATCH_DIR="/Users/air/ea_assistant"
LOG_FILE="/Users/air/AIR01/System/Logs/system-log.md"
FSWATCH_BIN="/opt/homebrew/bin/fswatch"

if [ ! -x "$FSWATCH_BIN" ]; then
  echo "❌ fswatch not found at $FSWATCH_BIN"
  exit 1
fi

echo "👀 Watching recursively for file changes in $WATCH_DIR ..."

"$FSWATCH_BIN" -0 -r "$WATCH_DIR" | while read -d "" file
do
  # Only log Python files
  if [[ "$file" == *.py ]]; then
    TIMESTAMP=$(date +"%Y-%m-%dT%H:%M")
    RELATIVE_PATH=${file#/Users/air/}
    echo "## ${TIMESTAMP} — Cursor Edit" >> "$LOG_FILE"
    echo "🔧 Modified: /${RELATIVE_PATH}" >> "$LOG_FILE"
    echo "🎯 Change: Edited with Cursor inline GPT" >> "$LOG_FILE"
    echo "🧪 Status: Auto-logged" >> "$LOG_FILE"
    echo "👀 Context: fswatch autolog" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    echo "✅ Logged change to /${RELATIVE_PATH}"
  fi
done
