import json
import shutil
from datetime import datetime
from pathlib import Path

from src.path_config import MCP_LOG, MCP_MEMORY_JSON

# Paths
md_path = Path("/Users/air/AIR01/MCP/loop_memory.md")
log_copy_path = Path("/Users/air/AIR01/MCP/sync_log.md")


def format_loop_md(loop):
    tags_list = loop.get("tags", [])
    tags_string = "[" + ", ".join(tags_list) + "]"

    frontmatter = f"""---
id: {loop["id"]}
summary: {loop["summary"]}
status: {loop["status"]}
tags: {tags_string}
source: {loop["source"]}
---"""

    body = f"""
### 🧠 {loop["summary"]}

**Status**: {loop["status"]}
**Source**: {loop["source"]}
"""

    return frontmatter.strip() + "\n\n" + body.strip()


def load_existing_ids(md_path):
    if not md_path.exists():
        return set()
    content = md_path.read_text()
    return set(
        line.split(":")[1].strip() for line in content.splitlines() if line.startswith("id:")
    )


def main():
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if not MCP_MEMORY_JSON.exists():
        print("No loop_memory.json found.")
        return

    with open(MCP_MEMORY_JSON, encoding="utf-8") as f:
        loops = json.load(f)

    existing_ids = load_existing_ids(md_path)
    new_entries = []

    for loop in loops:
        if loop["id"] not in existing_ids:
            new_entries.append(format_loop_md(loop))

    with open(MCP_LOG, "a", encoding="utf-8") as log:
        if new_entries:
            with open(md_path, "a", encoding="utf-8") as f:
                for entry in new_entries:
                    f.write("\n\n" + entry)
            log.write(f"[{timestamp}] ✅ {len(new_entries)} new loop(s) synced to loop_memory.md\n")
        else:
            log.write(f"[{timestamp}] No new loops to sync.\n")

    # Copy log to Obsidian vault
    shutil.copyfile(MCP_LOG, log_copy_path)


if __name__ == "__main__":
    main()
