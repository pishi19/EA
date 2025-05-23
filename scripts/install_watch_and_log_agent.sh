#!/bin/bash

PLIST_NAME="com.ora.watch_and_log.plist"
PLIST_SRC="$(pwd)/$PLIST_NAME"
PLIST_DEST=~/Library/LaunchAgents/$PLIST_NAME

cp "$PLIST_SRC" "$PLIST_DEST"
launchctl unload "$PLIST_DEST" 2>/dev/null
launchctl load "$PLIST_DEST"

echo "✅ watch_and_log agent installed and running"
