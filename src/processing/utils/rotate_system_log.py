#!/usr/bin/env python3
from datetime import datetime, timedelta
from pathlib import Path

LOG_FILE = Path("/Users/air/AIR01/System/Logs/system-log.md")
ARCHIVE_FILE = Path("/Users/air/AIR01/System/Logs/system-log-archive.md")
CUTOFF_DAYS = 7


def parse_log_entries():
    if not LOG_FILE.exists():
        return []
    entries = []
    current_entry = []
    for line in LOG_FILE.read_text().splitlines():
        if line.startswith("## 20") and "Cursor Edit" in line:
            if current_entry:
                entries.append("\n".join(current_entry))
            current_entry = [line]
        else:
            current_entry.append(line)
    if current_entry:
        entries.append("\n".join(current_entry))
    return entries


def rotate_logs():
    entries = parse_log_entries()
    cutoff = datetime.now() - timedelta(days=CUTOFF_DAYS)
    recent_entries = []
    archived_entries = []

    for entry in entries:
        try:
            timestamp_line = entry.split("\n")[0]
            timestamp_str = timestamp_line.split("—")[0].replace("##", "").strip()
            entry_time = datetime.strptime(timestamp_str, "%Y-%m-%dT%H:%M")
            if entry_time < cutoff:
                archived_entries.append(entry)
            else:
                recent_entries.append(entry)
        except Exception:
            recent_entries.append(entry)

    if archived_entries:
        with ARCHIVE_FILE.open("a") as af:
            af.write("\n\n".join(archived_entries) + "\n")

    LOG_FILE.write_text("\n\n".join(recent_entries) + "\n")
    print(f"✅ Archived {len(archived_entries)} old log entries from system-log.md.")
    # Triggered autolog test in Cursor


if __name__ == "__main__":
    rotate_logs()
