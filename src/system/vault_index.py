import json
from datetime import datetime
from pathlib import Path

import frontmatter

from src.system.path_config import INSIGHTS_DIR, LOOPS_DIR, VAULT_INDEX_FILE


def _format_created(value):
    if isinstance(value, datetime):
        return value.isoformat()
    elif isinstance(value, (int, float)):
        return datetime.utcfromtimestamp(value).isoformat()
    return str(value)

def _parse_md(file: Path) -> dict:
    try:
        post = frontmatter.load(file)
        raw_created = post.get("created", file.stat().st_mtime)
        return {
            "title": post.get("title") or file.stem,
            "created": _format_created(raw_created),
            "tags": post.get("tags", []),
            "roadmap_id": post.get("roadmap_id", post.get("id", None)),
            "path": str(file),
            "type": "loop" if "loop" in file.name else "insight"
        }
    except Exception as e:
        return {"error": str(e), "path": str(file)}

def generate_vault_index(loops_dir=LOOPS_DIR, insights_dir=INSIGHTS_DIR, index_out=VAULT_INDEX_FILE):
    items = []
    for f in loops_dir.glob("*.md"):
        items.append(_parse_md(f))
    for f in insights_dir.glob("*.md"):
        items.append(_parse_md(f))
    items = sorted(items, key=lambda x: x.get("created", ""), reverse=True)
    index_out.parent.mkdir(parents=True, exist_ok=True)
    index_out.write_text(json.dumps(items, indent=2))
    return index_out
