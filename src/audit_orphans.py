import re
from pathlib import Path

RETRO_PATH = Path("/Users/air/AIR01/Retrospectives")
DAILY_PATH = Path("/Users/air/AIR01/0001-HQ/Daily Assistant")
WEEKLY_PATH = Path("/Users/air/AIR01/0001-HQ/Weekly Assistant")
TASKS_FILE = Path("/Users/air/AIR01/0001-HQ/Signal_Tasks.md")


def find_referenced_loops():
    refs = set()
    files = list(DAILY_PATH.glob("*.md")) + list(WEEKLY_PATH.glob("*.md")) + [TASKS_FILE]
    for f in files:
        if f.exists():
            content = f.read_text(encoding="utf-8")
            refs.update(re.findall(r"\[\[(loop-[^\]]+)\]\]", content))
    return refs


def find_orphan_loops():
    existing_loops = {f.stem for f in RETRO_PATH.glob("loop-*.md")}
    referenced_loops = find_referenced_loops()
    return sorted(existing_loops - referenced_loops)
