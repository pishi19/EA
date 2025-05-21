import os
import re
from datetime import datetime
from pathlib import Path
from collections import defaultdict

RETRO_DIR = "/Users/air/AIR01/Retrospectives"
DASHBOARD_PATH = "/Users/air/AIR01/0001 HQ/Loop Dashboard.md"

loop_data = []

for filename in os.listdir(RETRO_DIR):
    if filename.startswith("loop-") and filename.endswith(".md"):
        full_path = os.path.join(RETRO_DIR, filename)
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()

        metadata = {
            "filename": filename.replace(".md", ""),
            "status": re.search(r"^status:\s*(\w+)", content, re.M),
            "type": re.search(r"^type:\s*(\w+)", content, re.M),
            "topic": re.search(r"^topic:\s*(\w+)", content, re.M),
            "summary": re.search(r"^summary:\s*(.+)", content, re.M),
            "verified": re.search(r"^verified:\s*(\w+)", content, re.M)
        }

        for key in metadata:
            if metadata[key]:
                metadata[key] = metadata[key].group(1)
            else:
                metadata[key] = "unknown"

        loop_data.append(metadata)

# Generate dashboard content
lines = ["# 🔁 Loop Memory Dashboard", ""]

# Open loops
lines.append("## ✅ Open Loops")
for loop in loop_data:
    if loop["status"] == "open":
        lines.append(f"- [[{loop['filename']}]] — {loop['summary']}")
lines.append("")

# Verified loops
lines.append("## 🔏 Verified Loops")
for loop in loop_data:
    if loop["verified"] == "true":
        lines.append(f"- [[{loop['filename']}]] — {loop['summary']}")
lines.append("")

# Closed but not verified
lines.append("## 🧪 Closed but Unverified Loops")
for loop in loop_data:
    if loop["status"] == "closed" and loop["verified"] != "true":
        lines.append(f"- [[{loop['filename']}]] — {loop['summary']}")
lines.append("")

# By type
lines.append("## 📂 Loops by Type")
type_groups = defaultdict(list)
for loop in loop_data:
    type_groups[loop["type"]].append(loop["filename"])

for t, filenames in sorted(type_groups.items()):
    lines.append(f"### {t}")
    for f in filenames:
        lines.append(f"- [[{f}]]")
    lines.append("")

# By topic
lines.append("## 🧠 Topics")
topic_groups = defaultdict(list)
for loop in loop_data:
    topic_groups[loop["topic"]].append(loop["filename"])

for topic, filenames in sorted(topic_groups.items()):
    lines.append(f"### {topic}")
    for f in filenames:
        lines.append(f"- [[{f}]]")
    lines.append("")

# Write dashboard file
Path(os.path.dirname(DASHBOARD_PATH)).mkdir(parents=True, exist_ok=True)
with open(DASHBOARD_PATH, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"✅ Loop dashboard written to: {DASHBOARD_PATH}")
