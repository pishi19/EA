#!/usr/bin/env python3
import os
import time
from datetime import datetime

WATCH_DIR = "/Users/air/ea_assistant"
LOG_FILE = "/Users/air/AIR01/System/Logs/system-log.md"
SCAN_INTERVAL = 5  # seconds

last_mtimes = {}


def log_change(filepath):
    timestamp = datetime.now().strftime("%Y-%m-%dT%H:%M")
    relative_path = filepath.replace("/Users/air/", "")
    with open(LOG_FILE, "a") as f:
        f.write(f"## {timestamp} — Cursor Edit\n")
        f.write(f"🔧 Modified: /{relative_path}\n")
        f.write("🎯 Change: Edited with Cursor inline GPT\n")
        f.write("🧪 Status: Auto-logged\n")
        f.write("👀 Context: polling_watchdog\n\n")
    print(f"✅ Logged change to /{relative_path}")


def scan_files():
    global last_mtimes
    for root, _, files in os.walk(WATCH_DIR):
        for filename in files:
            if filename.endswith(".py"):
                full_path = os.path.join(root, filename)
                try:
                    mtime = os.path.getmtime(full_path)
                except FileNotFoundError:
                    continue
                if full_path not in last_mtimes or mtime > last_mtimes[full_path]:
                    if full_path in last_mtimes:
                        log_change(full_path)
                    last_mtimes[full_path] = mtime


if __name__ == "__main__":
    print(f"👀 Polling for changes in {WATCH_DIR} every {SCAN_INTERVAL} seconds...")
    while True:
        scan_files()
        time.sleep(SCAN_INTERVAL)
