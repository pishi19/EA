#!/usr/bin/env python3
import re
from pathlib import Path

loop_dir = Path("/Users/air/AIR01/Retrospectives")
dashboard_path = Path("/Users/air/AIR01/System/Dashboards/cursor_environment.md")


def get_loop_summaries():
    summaries = []
    for file in loop_dir.glob("loop-*.md"):
        with file.open() as f:
            content = f.read()
        loop_id = re.search(r"id:\s*(loop-[\d\-]+)", content)
        summary = re.search(r"summary:\s*(.*)", content)
        status = re.search(r"status:\s*(\w+)", content)
        if loop_id and summary and status:
            summaries.append(f"- **{loop_id.group(1)}**: {summary.group(1)} _({status.group(1)})_")
    return summaries


def patch_dashboard():
    if not dashboard_path.exists():
        print("Dashboard file not found.")
        return

    with dashboard_path.open() as f:
        full_content = f.read()

    if "## 📋 TODO Summary" not in full_content:
        print("TODO Summary section not found.")
        return

    loop_summary_section = "## 🧠 Open Loop Summaries\n" + "\n".join(get_loop_summaries()) + "\n\n"
    parts = full_content.split("## 📋 TODO Summary")
    new_body = parts[0].rstrip() + "\n\n" + loop_summary_section + "## 📋 TODO Summary" + parts[1]

    dashboard_path.write_text(new_body)
    print("✅ Loop summaries added to dashboard.")


if __name__ == "__main__":
    patch_dashboard()
