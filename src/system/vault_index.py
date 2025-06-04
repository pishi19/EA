import json
import frontmatter
from pathlib import Path
from datetime import datetime

VAULT_PATH = Path("vault")
LOOPS_DIR = VAULT_PATH / "Retrospectives" / "Loops"
INSIGHTS_DIR = VAULT_PATH / "Retrospectives" / "Insights"
INDEX_OUT = Path("System/vault_index.json")

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

def generate_vault_index():
    items = []
    for f in LOOPS_DIR.glob("*.md"):
        items.append(_parse_md(f))
    for f in INSIGHTS_DIR.glob("*.md"):
        items.append(_parse_md(f))
    items = sorted(items, key=lambda x: x.get("created", ""), reverse=True)
    INDEX_OUT.parent.mkdir(parents=True, exist_ok=True)
    INDEX_OUT.write_text(json.dumps(items, indent=2))
    return INDEX_OUT
