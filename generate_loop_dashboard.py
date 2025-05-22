
import os
from pathlib import Path
import frontmatter

PROJECTS_PATH = "/Users/air/AIR01/02 Workstreams/Projects"
PROGRAMS_PATH = "/Users/air/AIR01/02 Workstreams/Programs"
DASHBOARD_PATH = "/Users/air/AIR01/0001-HQ/Dashboards/loop_status.md"

def collect_metadata(path, type_):
    rows = []
    for file in Path(path).glob("*.md"):
        post = frontmatter.load(file)
        rows.append({
            "id": post.get("id", file.stem),
            "type": type_,
            "status": post.get("status", "unknown"),
            "weight": post.get("weight", 0),
            "name": file.stem
        })
    return rows

def generate_dashboard(rows):
    open_items = [r for r in rows if r["status"] == "open"]
    closed_items = [r for r in rows if r["status"] == "closed"]

    with open(DASHBOARD_PATH, "w", encoding="utf-8") as f:
        f.write("# 📊 Loop & Project Status Dashboard\n")
        f.write("## 🔄 Open Items\n")
        for item in sorted(open_items, key=lambda x: -x["weight"]):
            f.write(f"- [{item['type']}] **{item['name']}** — weight: {item['weight']}\n")

        f.write("\n## ✅ Closed Items\n")
        for item in sorted(closed_items, key=lambda x: -x["weight"]):
            f.write(f"- [{item['type']}] **{item['name']}** — weight: {item['weight']}\n")
    print(f"✅ Dashboard updated: {DASHBOARD_PATH}")

def main():
    rows = collect_metadata(PROGRAMS_PATH, "program") + collect_metadata(PROJECTS_PATH, "project")
    generate_dashboard(rows)

if __name__ == "__main__":
    main()
