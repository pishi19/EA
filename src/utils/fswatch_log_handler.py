#!/usr/bin/env python3
import sys
from datetime import datetime

LOG_FILE = "/Users/air/AIR01/System/Logs/system-log.md"

for file_path in sys.stdin:
    file_path = file_path.strip()
    if not file_path.endswith(".py"):
        continue
    timestamp = datetime.now().strftime("%Y-%m-%dT%H:%M")
    relative_path = file_path.replace("/Users/air/", "")
    with open(LOG_FILE, "a") as log:
        log.write(f"## {timestamp} — Cursor Edit\n")
        log.write(f"🔧 Modified: /{relative_path}\n")
        log.write("🎯 Change: Edited with Cursor inline GPT\n")
        log.write("🧪 Status: Auto-logged\n")
        log.write("👀 Context: fswatch autolog\n\n")
    print(f"✅ Logged change to /{relative_path}")
