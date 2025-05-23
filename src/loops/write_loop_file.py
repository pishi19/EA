"""
write_loop_file.py

Writes the insight summary and metadata to a markdown file.
"""

from datetime import date
from pathlib import Path


def write_loop_file(summary, metadata):
    loop_id = f"loop-{date.today()}-{summary[:30].replace(' ', '-').lower()}"
    filename = f"{loop_id}.md"
    path = Path("/Users/air/AIR01/Retrospectives") / filename

    yaml_block = f"""---
id: {loop_id}
type: {metadata['type']}
status: {metadata['status']}
tags: {metadata['tags']}
source: {metadata['source']}
priority: {metadata['priority']}
created: {date.today()}
---
"""

    content = f"{yaml_block}\n# 🧠 Insight\n\n{summary}\n---\n\n### 🔁 Loop Controls\n[🚀 Promote to Project](shell:python3 ~/ea_assistant/promote_loop.py {loop_id})\n"
    path.write_text(content)
    return str(path), loop_id
