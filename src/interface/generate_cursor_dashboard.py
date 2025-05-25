#!/usr/bin/env python3
import re
from datetime import datetime
from pathlib import Path

# Paths
log_path = Path("/Users/air/AIR01/System/Logs/system-log.md")
loop_dir = Path("/Users/air/AIR01/Retrospectives")
dashboard_path = Path("/Users/air/AIR01/System/Dashboards/cursor_environment.md")


# Load recent edits from system-log.md
def get_recent_edits(limit=5):
    if not log_path.exists():
        return []
    edits = []
    with log_path.open() as f:
        lines = f.readlines()

    current = []
    log_started = False
    for line in lines:
        if line.startswith("## ") and "Cursor Edit" in line:
            if current:
                edits.append("".join(current).strip())
                current = []
            log_started = True
        if log_started:
            current.append(line)

    if current:
        edits.append("".join(current).strip())
    return edits[-limit:]


# Find open loops with source: cursor:*
def get_open_loops():
    open_loops = []
    for file in loop_dir.glob("loop-*.md"):
        with file.open() as f:
            content = f.read()
        if "source: cursor:" in content and "status: open" in content:
            loop_id = re.search(r"id:\s*(loop-[\d\-]+)", content)
            if loop_id:
                open_loops.append(f"- 🔁 `{loop_id.group(1)}`")
    return open_loops


# Extract TODOs from system-log.md
def get_todos():
    if not log_path.exists():
        return []
    todos = []
    with log_path.open() as f:
        for line in f:
            if line.strip().startswith("- [ ]"):
                todos.append(line.strip())
    return todos


# Generate dashboard content
def generate_dashboard():
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    edits = get_recent_edits()
    loops = get_open_loops()
    todos = get_todos()

    content = f"""---
title: "Cursor-GPT Environment Dashboard"
updated: {now}
status: live
---

# 📊 Cursor-GPT Environment Dashboard

Live overview of development activity tracked between Cursor, GPT, and the Ora system.

---

## 🔧 Recent Cursor Edits
{chr(10).join(edits) if edits else "No recent edits found."}

---

## 🔄 Open Loops From Cursor
{chr(10).join(loops) if loops else "No open loops from Cursor found."}

---

## 📋 TODO Summary
{chr(10).join(todos) if todos else "No TODOs found in system-log.md."}

---

## 📎 Trace Links

- 🔗 [`system-log.md`](../Logs/system-log.md)
- 🔗 [`loop-template.md`](../../Retrospectives/loop-template.md)
- 🔗 [`cursor_workflow.md`](../Reference/cursor_workflow.md)
"""
    dashboard_path.write_text(content)
    print("✅ Dashboard updated at", dashboard_path)


if __name__ == "__main__":
    generate_dashboard()
