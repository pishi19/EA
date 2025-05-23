
import re
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

import frontmatter

RETRO_PATH = Path("/Users/air/AIR01/Retrospectives")
WEEKLY_PATH = Path("/Users/air/AIR01/0001-HQ/Weekly Assistant")
DASHBOARD_PATH = Path("/Users/air/AIR01/0001-HQ/Dashboards/loop_impact_dashboard.md")
FEEDBACK_LOG = Path("/Users/air/AIR01/System/Logs/feedback_trace_log.md")

def get_loop_metadata():
    loop_data = {}
    for file in RETRO_PATH.glob("loop-*.md"):
        try:
            post = frontmatter.load(file)
            loop_id = post.get("id", file.stem)
            loop_data[loop_id] = {
                "status": post.get("status", "unknown"),
                "weight": post.get("weight", 0),
            }
        except Exception:
            continue
    return loop_data

def count_loop_mentions():
    mention_counts = Counter()
    for file in WEEKLY_PATH.glob("*.md"):
        text = file.read_text(encoding="utf-8")
        matches = re.findall(r"\[\[loop-[^\]]+\]\]", text)
        mention_counts.update([m.strip("[]") for m in matches])
    return mention_counts

def parse_feedback_log():
    useful = defaultdict(int)
    false_pos = defaultdict(int)

    if FEEDBACK_LOG.exists():
        for line in FEEDBACK_LOG.read_text(encoding="utf-8").splitlines():
            if "#useful" in line:
                match = re.search(r"\[\[([^\]]+)\]\]", line)
                if match:
                    useful[match.group(1)] += 1
            elif "#false_positive" in line:
                match = re.search(r"\[\[([^\]]+)\]\]", line)
                if match:
                    false_pos[match.group(1)] += 1
    return useful, false_pos

def write_dashboard(metadata, mentions, useful, false_pos):
    lines = ["# 📊 Loop Impact Dashboard", ""]

    top_mentions = mentions.most_common(5)
    lines.append("## 🔝 Most Referenced Loops")
    if top_mentions:
        for i, (loop, count) in enumerate(top_mentions, 1):
            lines.append(f"{i}. [[{loop}]] ({count} mentions)")
    else:
        lines.append("🚫 No mentions found.")
    lines.append("")

    promoted = {k: v for k, v in metadata.items() if v["status"] == "promoted"}
    lines.append("## 🚀 Most Promoted")
    if promoted:
        for loop_id, meta in sorted(promoted.items(), key=lambda x: -x[1]["weight"]):
            lines.append(f"- [[{loop_id}]] (weight: {meta['weight']})")
    else:
        lines.append("🚫 No loops marked as promoted.")
    lines.append("")

    lines.append("## 🧠 Feedback Signals")
    lines.append("| Loop ID | #useful | #false_positive | Weight | Status |")
    lines.append("|---------|---------|------------------|--------|--------|")

    all_loops = set(metadata.keys()) | set(useful.keys()) | set(false_pos.keys())
    for loop_id in sorted(all_loops):
        u = useful.get(loop_id, 0)
        f = false_pos.get(loop_id, 0)
        w = metadata.get(loop_id, {}).get("weight", "-")
        s = metadata.get(loop_id, {}).get("status", "-")
        lines.append(f"| [[{loop_id}]] | {u} | {f} | {w} | {s} |")

    lines.append("")
    lines.append(f"📅 Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    DASHBOARD_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"✅ Loop impact dashboard written to: {DASHBOARD_PATH}")

def main():
    metadata = get_loop_metadata()
    mentions = count_loop_mentions()
    useful, false_pos = parse_feedback_log()
    write_dashboard(metadata, mentions, useful, false_pos)

if __name__ == "__main__":
    main()
