#!/bin/bash

# Interactive logging script for Cursor edits

LOG_FILE="/Users/air/AIR01/System/Logs/system-log.md"

echo "📄 Enter the relative path to the file you edited (e.g., /tasks/routing.py):"
read FILE_PATH

echo "📝 Enter a short summary of what changed:"
read SUMMARY

TIMESTAMP=$(date +"%Y-%m-%dT%H:%M")

echo "## ${TIMESTAMP} — Cursor Edit" >> "$LOG_FILE"
echo "🔧 Modified: ${FILE_PATH}" >> "$LOG_FILE"
echo "🎯 Change: ${SUMMARY}" >> "$LOG_FILE"
echo "🧪 Status: Draft" >> "$LOG_FILE"
echo "👀 Context: Cursor inline GPT" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

echo "✅ Logged to system-log.md"
