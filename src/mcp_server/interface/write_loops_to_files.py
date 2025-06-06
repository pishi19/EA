import json
from pathlib import Path

from src.path_config import MCP_MEMORY_JSON

# Paths
output_dir = Path("/Users/air/AIR01/MCP/Loops")
output_dir.mkdir(parents=True, exist_ok=True)


def format_loop_md(loop):
    tags_string = "[" + ", ".join(loop.get("tags", [])) + "]"
    loop_id = loop["id"]
    verified = loop.get("verified", True)

    frontmatter = f"""---
id: {loop_id}
summary: {loop["summary"]}
status: {loop["status"]}
tags: {tags_string}
source: {loop["source"]}
verified: {str(verified).lower()}
---"""

    body = f"""
### 🧠 {loop["summary"]}

This loop was automatically generated from retrospective analysis.

**Status:** {loop["status"]}
**Source:** {loop["source"]}

### 🔄 Loop Controls

[✅ Mark loop as closed](shell:python3 ~/ea_assistant/mcp_server/interface/mcp_memory.py status {loop_id} closed)
[🔁 Reopen loop](shell:python3 ~/ea_assistant/mcp_server/interface/mcp_memory.py status {loop_id} open)
"""

    return frontmatter.strip() + "\n\n" + body.strip()


def main():
    if not MCP_MEMORY_JSON.exists():
        print("❌ loop_memory.json not found.")
        return

    with open(MCP_MEMORY_JSON) as f:
        loops = json.load(f)

    for loop in loops:
        loop_id = loop.get("id")
        if not loop_id:
            continue
        filename = f"{loop_id}.md"
        output_file = output_dir / filename
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(format_loop_md(loop))
        print(f"✅ Wrote {filename}")


if __name__ == "__main__":
    main()
