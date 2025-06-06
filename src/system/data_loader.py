import os
import frontmatter
from datetime import datetime
from src.system import path_config
from pathlib import Path

def parse_file(path: str) -> dict:
    try:
        post = frontmatter.load(path)
        metadata = post.metadata or {}
        tags = metadata.get("tags", [])

        raw_created = metadata.get("created")
        if isinstance(raw_created, datetime):
            created = raw_created
        elif isinstance(raw_created, str):
            created = datetime.fromisoformat(raw_created)
        else:
            created = datetime.fromtimestamp(path.stat().st_mtime)

        return {
            "path": path,
            "content": post.content,
            "metadata": metadata,
            "tags": tags,
            "created": created
        }

    except Exception as e:
        print(f"[data_loader] Failed to parse {path}: {e}")
        return None

def get_inbox_entries() -> list[dict]:
    from src.system import path_config
    return _load_from_dir(path_config.INBOX_DIR)

def _load_from_dir(directory: Path) -> list[dict]:
    """
    Loads all .md files from a directory.
    If the directory does not exist, it will be created.
    """
    items = []
    if not directory.exists():
        print(f"[data_loader] Directory does not exist, creating: {directory}")
        directory.mkdir(parents=True, exist_ok=True)
        return []

    for file in sorted(directory.iterdir()):
        if file.name.startswith("_") or not file.name.endswith(".md"):
            continue
        if not file.is_file():
            continue

        parsed = parse_file(file)
        if parsed:
            items.append(parsed)

    return sorted(items, key=lambda x: x["created"], reverse=True)

def get_all_loops() -> list[dict]:
    from src.system import path_config
    return _load_from_dir(path_config.LOOPS_DIR)

def get_all_roadmaps() -> list[dict]:
    from src.system import path_config
    print("[DEBUG] Loaded roadmap item metadata:")
    for item in _load_from_dir(path_config.ROADMAP_DIR):
        print(item["metadata"])
    return _load_from_dir(path_config.ROADMAP_DIR)

def get_loop_summaries() -> list[dict]:
    loops = get_all_loops()
    return [
        {
            "id": loop["metadata"].get("id"),
            "summary": loop["metadata"].get("summary"),
            "tags": loop["tags"],
            "score": loop["metadata"].get("score", 0)
        }
        for loop in loops
        if "summary" in loop["metadata"]
    ]

def get_insights() -> list[dict]:
    from src.system import path_config
    print(f"[DEBUG] Loading insights from: {path_config.INSIGHTS_DIR}")
    return _load_from_dir(path_config.INSIGHTS_DIR) 