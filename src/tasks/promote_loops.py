import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional

import frontmatter

LOOP_PATH = "/Users/air/AIR01/Retrospectives"
PROJECT_PATH = "/Users/air/AIR01/02 Workstreams/Projects"
PROMOTE_THRESHOLD = 4.0
LOG_PATH = "/Users/air/AIR01/System/Logs/loop_promotions.md"
DB_PATH = "/Users/air/AIR01/System/data/loops.db"


def get_loop_metrics(loop_id: str) -> dict:
    """Get loop metrics from database."""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT weight, useful_count, false_positive_count, mention_count
            FROM loop_metrics WHERE loop_id = ?
        """,
            (loop_id,),
        )
        row = cursor.fetchone()
        return (
            {
                "weight": row[0] if row else 0,
                "useful_count": row[1] if row else 0,
                "false_positive_count": row[2] if row else 0,
                "mention_count": row[3] if row else 0,
            }
            if row
            else {}
        )


def validate_promotion_criteria(metrics: dict) -> bool:
    """Validate if loop meets promotion criteria."""
    return (
        metrics["weight"] >= PROMOTE_THRESHOLD
        and metrics["useful_count"] > metrics["false_positive_count"]
        and metrics["mention_count"] >= 3
    )


def create_project_file(loop_id: str, content: str) -> Path:
    """Create project file from loop content."""
    project_dir = Path(PROJECT_PATH)
    project_dir.mkdir(parents=True, exist_ok=True)

    project_id = f"project-{loop_id.replace('loop-', '')}"
    project_path = project_dir / f"{project_id}.md"

    yaml_block = f"""---
id: {project_id}
source_loop: {loop_id}
created: {datetime.now().date()}
status: active
weight: {get_loop_metrics(loop_id)['weight']}
---
"""
    with project_path.open("w") as f:
        f.write(yaml_block)
        f.write("\n# 🚀 Project\n\n")
        f.write(content.split("---")[-1].strip())

    return project_path


def update_loop_metadata(loop_path: Path, project_path: Path):
    """Update loop metadata with project link."""
    post = frontmatter.load(loop_path)
    post["status"] = "promoted"
    post["linked_project"] = str(project_path.relative_to(Path("/Users/air/AIR01")))
    post["promoted_at"] = datetime.now().isoformat()

    with loop_path.open("w") as f:
        f.write(frontmatter.dumps(post))


def log_promotion(loop_id: str, project_path: Path, metrics: dict):
    """Log promotion details."""
    log_path = Path(LOG_PATH)
    log_path.parent.mkdir(parents=True, exist_ok=True)

    with log_path.open("a") as f:
        f.write(
            f"""
## {datetime.now().isoformat()}
- Loop: {loop_id}
- Project: {project_path.name}
- Weight: {metrics['weight']}
- Useful Count: {metrics['useful_count']}
- False Positives: {metrics['false_positive_count']}
- Mentions: {metrics['mention_count']}
"""
        )


def promote_loop(file_path: Path) -> Optional[Path]:
    """Promote a loop to project if criteria met."""
    loop_id = file_path.stem
    metrics = get_loop_metrics(loop_id)

    if not validate_promotion_criteria(metrics):
        print(f"ℹ️ Loop {loop_id} does not meet promotion criteria")
        return None

    try:
        content = file_path.read_text()
        project_path = create_project_file(loop_id, content)
        update_loop_metadata(file_path, project_path)
        log_promotion(loop_id, project_path, metrics)
        print(f"✅ Promoted {loop_id} to project {project_path.name}")
        return project_path
    except Exception as e:
        print(f"❌ Failed to promote {loop_id}: {e}")
        return None


def main():
    """Main promotion process."""
    promoted_count = 0
    for file in Path(LOOP_PATH).glob("loop-*.md"):
        if promote_loop(file):
            promoted_count += 1

    print("\nPromotion Summary:")
    print(f"- Total loops processed: {len(list(Path(LOOP_PATH).glob('loop-*.md')))}")
    print(f"- Successfully promoted: {promoted_count}")


if __name__ == "__main__":
    main()
