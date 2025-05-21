import os
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

# Config
DB_PATH = "/Users/air/ea_assistant/db/loop_feedback.db"
LOOP_DIR = "/Users/air/AIR01/Retrospectives/loops"
OUTPUT_FILE = "/Users/air/AIR01/System/Dashboards/loop-status.md"

def count_loop_files():
    open_loops = closed_loops = verified_loops = 0
    total_loops = 0
    for file in Path(LOOP_DIR).glob("*.md"):
        with open(file) as f:
            content = f.read()
            if "status: open" in content:
                open_loops += 1
            elif "status: closed" in content:
                closed_loops += 1
            if "verified: true" in content:
                verified_loops += 1
            total_loops += 1
    return total_loops, open_loops, closed_loops, verified_loops

def recent_feedback_counts(days=7):
    now = datetime.now()
    cutoff = now - timedelta(days=days)
    useful = noise = 0
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT feedback_type, COUNT(*) FROM loop_feedback WHERE timestamp >= ? GROUP BY feedback_type", (cutoff.isoformat(),))
        for feedback_type, count in cursor.fetchall():
            if feedback_type == "useful":
                useful = count
            elif feedback_type == "noise":
                noise = count
    return useful, noise

def write_status_file(total, open_, closed, verified, useful, noise):
    verified_percent = round((verified / total * 100), 1) if total > 0 else 0
    content = f"""# 📊 Loop Status Dashboard

## Loop Summary
- **Total Loops:** {total}
- **Open:** {open_}
- **Closed:** {closed}
- **Verified:** {verified} ({verified_percent}%)

## Feedback (Last 7 Days)
- ✅ Useful: {useful}
- ❌ Noise: {noise}

_Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}_
"""
    Path(OUTPUT_FILE).write_text(content)
    print(f"✅ Dashboard written to {OUTPUT_FILE}")

def main():
    total, open_, closed, verified = count_loop_files()
    useful, noise = recent_feedback_counts()
    write_status_file(total, open_, closed, verified, useful, noise)

if __name__ == "__main__":
    main()
