import os
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path

LOG_PATH = "/Users/air/AIR01/System/Logs/email-feedback-log.md"
REPORT_ROOT = "/Users/air/AIR01/Reports/Feedback"

VALID_TAGS = ["#useful", "#false_positive", "#ignored", "#noise"]

def parse_log():
    if not os.path.exists(LOG_PATH):
        print("❌ Log file not found.")
        return []

    entries = []
    with open(LOG_PATH, "r", encoding="utf-8") as f:
        for line in f:
            match = re.match(r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}).*?\| (.*?) \| (.*?) \| (.*)", line.strip())
            if match:
                ts_str, thread_id, tags_str, content = match.groups()
                timestamp = datetime.fromisoformat(ts_str)
                tags = [tag for tag in tags_str.split(",") if tag.strip() in VALID_TAGS]
                entries.append((timestamp, thread_id, tags, content))
    return entries

def group_entries(entries, by):
    grouped = defaultdict(list)
    for ts, thread_id, tags, content in entries:
        if by == "daily":
            key = ts.strftime("%Y-%m-%d")
        elif by == "weekly":
            key = f"{ts.year}-W{ts.isocalendar().week:02d}"
        elif by == "monthly":
            key = ts.strftime("%Y-%m")
        else:
            continue
        grouped[key].append((ts, thread_id, tags, content))
    return grouped

def write_reports(grouped, kind):
    for key, entries in grouped.items():
        dir_path = Path(REPORT_ROOT) / kind.capitalize()
        dir_path.mkdir(parents=True, exist_ok=True)
        report_path = dir_path / f"{key}.md"
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(f"# 📊 {kind.capitalize()} Feedback Report: {key}\n\n")
            tag_counts = defaultdict(int)
            for _, _, tags, _ in entries:
                for tag in tags:
                    tag_counts[tag] += 1
            for tag in VALID_TAGS:
                f.write(f"- {tag}: {tag_counts[tag]}\n")
            f.write("\n---\n\n")
            for ts, thread_id, tags, content in entries:
                f.write(f"- {ts.isoformat()} | {thread_id} | {', '.join(tags)}\n  > {content}\n\n")
    print(f"✅ {kind.capitalize()} reports written.")

def main():
    entries = parse_log()
    if not entries:
        print("ℹ️ No entries to process.")
        return

    for kind in ["daily", "weekly", "monthly"]:
        grouped = group_entries(entries, kind)
        write_reports(grouped, kind)

if __name__ == "__main__":
    main()
