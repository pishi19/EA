import datetime
from pathlib import Path

from config import VAULT_PATH

YESTERDAY_PATH = Path(VAULT_PATH) / "01 Periodic" / "Daily"
REFLECTIONS_PATH = Path(VAULT_PATH) / "memory" / "reflections.md"
LOG_PATH = Path.home() / "ea_assistant" / "logs" / "system-log.md"


def load_yesterday_note():
    yesterday = (datetime.date.today() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
    note_path = YESTERDAY_PATH / f"{yesterday}.md"
    if note_path.exists():
        with open(note_path) as f:
            content = f.read()
        tasks = [line.strip() for line in content.splitlines() if line.strip().startswith("- [ ]")]
        return tasks, content
    return [], ""


def load_recent_reflection(lines=5):
    if REFLECTIONS_PATH.exists():
        with open(REFLECTIONS_PATH) as f:
            return "".join(f.readlines()[-lines:])
    return ""


def load_recent_log_activity(hours=48):
    if LOG_PATH.exists():
        with open(LOG_PATH) as f:
            lines = f.readlines()
        cutoff = datetime.datetime.now() - datetime.timedelta(hours=hours)
        recent_entries = [
            line for line in lines if line.startswith("[") and parse_log_time(line) >= cutoff
        ]
        return len(recent_entries), recent_entries[-1] if recent_entries else ""
    return 0, ""


def parse_log_time(line):
    try:
        timestamp = line.split("]")[0].strip("[")
        return datetime.datetime.strptime(timestamp, "%Y-%m-%d %H:%M")
    except Exception:
        return datetime.datetime.min


def build_context_block():
    tasks, yesterday_content = load_yesterday_note()
    reflections = load_recent_reflection()
    log_count, last_log = load_recent_log_activity()

    block = []
    block.append("## 🔄 Context Summary")
    block.append(f"- Unfinished tasks from yesterday: {len(tasks)}")
    if reflections:
        block.append(f"- Recent reflection: {reflections.strip()}")
    block.append(f"- EA system log entries in last 48h: {log_count}")
    if last_log:
        block.append(f"- Last log entry: {last_log.strip()}")

    block.append("- Slack/Email/Meetings: [🔜 coming soon]")
    return "\n".join(block)


if __name__ == "__main__":
    context = build_context_block()
    print("🔍 Daily Context Block:")
    print(context)
