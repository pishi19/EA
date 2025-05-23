"""
promote_loop.py

Promotes a loop into a new project. Copies relevant content, updates YAML,
creates a project note, and logs the promotion.
"""

import argparse
from datetime import datetime
from pathlib import Path

RETRO_DIR = Path("/Users/air/AIR01/Retrospectives")
PROJECT_DIR = Path("/Users/air/AIR01/02 Projects/Promoted")
LOG_PATH = Path("/Users/air/AIR01/System/Logs/loop_promotions.md")

def read_loop(loop_id):
    loop_file = RETRO_DIR / f"{loop_id}.md"
    if not loop_file.exists():
        raise FileNotFoundError(f"Loop {loop_id} not found.")
    return loop_file.read_text(), loop_file

def create_project_file(loop_id, content):
    PROJECT_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{loop_id.replace('loop-', 'project-')}.md"
    project_path = PROJECT_DIR / filename

    with project_path.open("w") as f:
        f.write(f"---\nsource_loop: {loop_id}\ncreated: {datetime.now().date()}\n---\n")
        f.write("# 🚀 Promoted Project\n\n")
        f.write(content.split('---')[-1].strip())  # skip YAML if present

    return project_path

def update_loop_yaml(loop_file_path, loop_id, project_path):
    lines = loop_file_path.read_text().splitlines()
    for i, line in enumerate(lines):
        if line.strip().startswith("promoted:"):
            lines[i] = "promoted: true"
            break
    else:
        for i, line in enumerate(lines):
            if line.strip() == "---":
                lines.insert(i, "promoted: true")
                lines.insert(i + 1, f"linked_project: obsidian:{project_path}")
                break
    loop_file_path.write_text("\n".join(lines))

def log_promotion(loop_id, project_path):
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a") as log:
        log.write(f"- {datetime.now().isoformat(timespec='seconds')} — `{loop_id}` promoted to `[project]({project_path})`\n")

def main():
    parser = argparse.ArgumentParser(description="Promote a loop into a tracked project")
    parser.add_argument("loop_id", help="The loop ID to promote")
    args = parser.parse_args()

    content, loop_file = read_loop(args.loop_id)
    project_path = create_project_file(args.loop_id, content)
    update_loop_yaml(loop_file, args.loop_id, project_path)
    log_promotion(args.loop_id, project_path)

    print(f"✅ Loop {args.loop_id} promoted to project at {project_path}")

if __name__ == "__main__":
    main()
