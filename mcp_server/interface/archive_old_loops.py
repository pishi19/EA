import os
from pathlib import Path
from datetime import datetime

# Directory configuration
loops_dir = Path("/Users/air/AIR01/MCP/Loops")
archive_dir = loops_dir / "Archive"
archive_dir.mkdir(exist_ok=True)

# Cutoff date for archiving (e.g., archive all loops before this date)
CUTOFF_DATE = "2025-05-21"

def get_loop_date(filename):
    try:
        parts = filename.split("-")
        return f"{parts[1]}-{parts[2]}-{parts[3][:2]}"
    except Exception:
        return ""

def should_archive(filename):
    if not filename.startswith("loop-") or not filename.endswith(".md"):
        return False
    loop_date = get_loop_date(filename)
    return loop_date < CUTOFF_DATE

def archive_loops():
    moved = 0
    for file in loops_dir.iterdir():
        if file.is_file() and should_archive(file.name):
            dest = archive_dir / file.name
            file.rename(dest)
            moved += 1
            print(f"📦 Archived {file.name}")
    if moved == 0:
        print("✅ No old loop files to archive.")
    else:
        print(f"✅ Archived {moved} loop files.")

if __name__ == "__main__":
    archive_loops()
