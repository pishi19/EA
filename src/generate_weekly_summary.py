
import re
from datetime import datetime, timedelta
from pathlib import Path

DAILY_DIR = Path("/Users/air/AIR01/0001-HQ/Daily Assistant")
WEEKLY_DIR = Path("/Users/air/AIR01/0001-HQ/Weekly Assistant")
WEEKLY_DIR.mkdir(parents=True, exist_ok=True)

def get_week_number(date):
    return f"{date.strftime('%Y')}-W{date.strftime('%V')}"

def collect_week_notes():
    today = datetime.today()
    start_date = today - timedelta(days=today.weekday(), weeks=1)
    end_date = start_date + timedelta(days=6)

    entries = []
    for f in sorted(DAILY_DIR.glob("20*-assistant.md")):
        try:
            date_str = f.stem.split("-assistant")[0]
            file_date = datetime.strptime(date_str, "%Y-%m-%d")
            if start_date <= file_date <= end_date:
                content = f.read_text(encoding="utf-8")
                entries.append((file_date.strftime("%A, %b %d"), content))
        except Exception:
            continue
    return entries, get_week_number(start_date)

def extract_summary_lines(entries):
    summaries = []
    promoted = []
    feedback = {"#useful": 0, "#false_positive": 0}

    for label, text in entries:
        lines = text.splitlines()
        content = [line.strip() for line in lines if line.startswith("✅") or "Promoted" in line]
        summaries.append(f"### {label}\n" + "\n".join(content))

        promoted += re.findall(r"\[\[loop-[^\]]+\]\]", text)
        feedback["#useful"] += text.count("#useful")
        feedback["#false_positive"] += text.count("#false_positive")

    return summaries, promoted, feedback

def write_weekly_note(week_id, summaries, promoted, feedback):
    file_path = WEEKLY_DIR / f"{week_id}-summary.md"
    title = f"Weekly Summary – {week_id}"

    tags = ["weekly_summary", "assistant"]
    aliases = [f"{week_id} Summary", f"Weekly Summary {week_id}"]
    tag_lines = "\n  - ".join(tags)
    alias_lines = "\n  - ".join(aliases)

    promoted_section = (
        "\n".join(f"- {loop}" for loop in set(promoted))
        if promoted else "🚫 No loops were promoted this week."
    )

    feedback_section = (
        f"- {feedback['#useful']} useful signals\n"
        f"- {feedback['#false_positive']} false positives"
        if feedback["#useful"] > 0 or feedback["#false_positive"] > 0
        else "🚫 No feedback recorded this week."
    )

    summary_section = "\n\n".join(summaries) if summaries else "🚫 No daily summaries found for this week."

    content = f"""---
title: {title}
week: {week_id}
type: weekly_summary
tags:
  - {tag_lines}
aliases:
  - {alias_lines}
---

## 🧾 Weekly Assistant Summary

**Promoted Loops:**  
{promoted_section}

**Feedback:**  
{feedback_section}

## 📅 Daily Highlights

{summary_section}

📅 Generated automatically every Monday at 6:00 AM.
"""

    file_path.write_text(content, encoding="utf-8")
    print(f"✅ Weekly summary written to: {file_path}")

def main():
    entries, week_id = collect_week_notes()
    summaries, promoted, feedback = extract_summary_lines(entries)
    write_weekly_note(week_id, summaries, promoted, feedback)

if __name__ == "__main__":
    main()
