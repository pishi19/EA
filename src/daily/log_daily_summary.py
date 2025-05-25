from datetime import datetime
from pathlib import Path

VAULT_PATH = "/Users/air/AIR01"
DAILY_PATH = Path(VAULT_PATH) / "0001-HQ" / "Daily Assistant"
ADMIN_PATH = Path(VAULT_PATH) / "0001-HQ" / "Dashboards" / "Loop Admin.md"
LOG_PATH = Path("/Users/air/Library/Logs/ora/daily_refresh.log")


def update_loop_admin_backlinks(date_str):
    if not ADMIN_PATH.exists():
        return

    note_link = f"[[{date_str}-assistant]]"
    lines = ADMIN_PATH.read_text(encoding="utf-8").splitlines()

    # Look for the backlink block
    start = None
    for i, line in enumerate(lines):
        if line.strip() == "## 🗓 Recent Assistant Notes":
            start = i
            break

    if start is not None:
        # Collect existing note links, avoiding duplicates
        recent = [line.strip() for line in lines[start + 1 :] if line.strip().startswith("- [[")]
        if note_link in recent:
            recent.remove(note_link)
        recent.insert(0, f"- {note_link}")
        recent = recent[:5]  # keep only the most recent 5
        lines = lines[: start + 1] + recent
    else:
        # Append the block at the end
        lines.append("")
        lines.append("## 🗓 Recent Assistant Notes")
        lines.append(f"- {note_link}")

    ADMIN_PATH.write_text("\n".join(lines), encoding="utf-8")


def generate_summary():
    date_str = datetime.now().strftime("%Y-%m-%d")
    note_path = DAILY_PATH / f"{date_str}-assistant.md"

    if not LOG_PATH.exists():
        summary = "⚠️ No log found for today's refresh run."
    else:
        with open(LOG_PATH, encoding="utf-8") as log_file:
            lines = log_file.readlines()
            recent = [line for line in lines if date_str in line]
            summary_lines = [line for line in recent if "✅" in line or "▶" in line or "❌" in line]
            summary = "".join(summary_lines).strip() or "⚠️ No tasks were logged."

    note = f"""---
date: {date_str}
type: assistant_summary
tags: [#assistant, #daily, #refresh]
---

## ✅ Daily Assistant Summary

{summary}

→ View dashboard: [[loop_status]]
→ Loop ecosystem: [[Loop Admin]]

📅 Logged automatically from `daily_refresh.py`
"""

    DAILY_PATH.mkdir(parents=True, exist_ok=True)
    note_path.write_text(note, encoding="utf-8")
    update_loop_admin_backlinks(date_str)
    print(f"✅ Daily assistant note written to: {note_path}")


if __name__ == "__main__":
    generate_summary()
