#!/bin/bash

PLIST_NAME="com.ora.generate_cursor_dashboard.plist"
PLIST_SRC="$(pwd)/$PLIST_NAME"
PLIST_DEST=~/Library/LaunchAgents/$PLIST_NAME

# Copy and load the launch agent
cp "$PLIST_SRC" "$PLIST_DEST"
launchctl unload "$PLIST_DEST" 2>/dev/null
launchctl load "$PLIST_DEST"

echo "✅ LaunchAgent installed and loaded: $PLIST_NAME"
