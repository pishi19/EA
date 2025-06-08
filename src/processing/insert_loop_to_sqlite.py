import re
import sqlite3
from datetime import datetime
from pathlib import Path

import yaml

from src.path_config import MCP_MEMORY_DB

RETRO_PATH = Path("/Users/air/AIR01/Retrospectives")


def parse_loop_file(file_path: Path):
    content = file_path.read_text()
    frontmatter_match = re.search(r"---\n(.*?)\n---", content, re.DOTALL)
    if not frontmatter_match:
        raise ValueError("No YAML frontmatter found.")

    # Preprocess: quote tags if unquoted
    yaml_block = frontmatter_match.group(1)
    yaml_block = re.sub(
        r"tags:\s*\[(.*?)\]",
        lambda m: "tags: [{}]".format(
            ", ".join(f'"{tag.strip()}"' for tag in m.group(1).split(","))
        ),
        yaml_block,
    )

    frontmatter = yaml.safe_load(yaml_block)

    return {
        "loop_id": frontmatter.get("id", file_path.stem),
        "summary": frontmatter.get("summary", ""),
        "tags": ", ".join(frontmatter.get("tags", [])),
        "topic": frontmatter.get("topic", ""),
        "source": frontmatter.get("source", ""),
        "created_at": frontmatter.get("created_at", datetime.now().isoformat()),
        "status": frontmatter.get("status", "open"),
    }


def insert_loop(loop: dict):
    conn = sqlite3.connect(MCP_MEMORY_DB)
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS loops (
            loop_id TEXT PRIMARY KEY,
            summary TEXT,
            tags TEXT,
            topic TEXT,
            source TEXT,
            created_at TEXT,
            status TEXT
        )
    """
    )

    cursor.execute(
        """
        INSERT OR REPLACE INTO loops (loop_id, summary, tags, topic, source, created_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """,
        (
            loop["loop_id"],
            loop["summary"],
            loop["tags"],
            loop["topic"],
            loop["source"],
            loop["created_at"],
            loop["status"],
        ),
    )

    conn.commit()
    conn.close()
    print(f"✅ Inserted loop {loop['loop_id']} into loop memory.")


def main():
    latest_file = max(RETRO_PATH.glob("loop-*.md"), key=lambda f: f.stat().st_mtime)
    loop = parse_loop_file(latest_file)
    insert_loop(loop)


if __name__ == "__main__":
    main()
