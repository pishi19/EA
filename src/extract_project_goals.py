import json
import logging
import os
import re
from pathlib import Path

import yaml

# Configuration
VAULT_PATH = Path("/Users/air/AIR01")
PROJECTS_DIR = VAULT_PATH / "02 Workstreams/Projects"
OUTPUT_PATH = VAULT_PATH / "System/Data/project_goals.json"
LOG_PATH = VAULT_PATH / "System/Logs/extract_project_goals.log"

# Setup logging
logging.basicConfig(
    filename=LOG_PATH,
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)


def extract_yaml_frontmatter(file_path):
    try:
        with open(file_path, encoding="utf-8") as f:
            lines = f.readlines()
        if lines[0].strip() == "---":
            end_idx = lines[1:].index("---\n") + 1
            yaml_str = "".join(lines[1:end_idx])
            return yaml.safe_load(yaml_str)
    except Exception as e:
        logging.warning(f"Failed to parse YAML from {file_path}: {e}")
    return {}


def normalize_goals(raw_goals):
    goals = []
    if isinstance(raw_goals, str):
        goals = [raw_goals]
    elif isinstance(raw_goals, list):
        goals = raw_goals
    normalized = []
    for goal in goals:
        if not isinstance(goal, str):
            continue
        clean = goal.strip().lower()
        clean = re.sub(r"^[\-\*\d\.\)\s]+", "", clean)
        clean = re.sub(r"[\n\r]+", " ", clean)
        normalized.append(clean)
    return normalized


def scan_project_files():
    results = []
    for root, _, files in os.walk(PROJECTS_DIR):
        for file in files:
            if file.endswith(".md"):
                file_path = Path(root) / file
                yaml_data = extract_yaml_frontmatter(file_path)
                raw_goals = yaml_data.get("goal", None)
                if raw_goals:
                    normalized_goals = normalize_goals(raw_goals)
                    rel_path = file_path.relative_to(VAULT_PATH)
                    project_id = yaml_data.get("id", file_path.stem)
                    results.append(
                        {
                            "id": project_id,
                            "path": str(rel_path),
                            "goals": normalized_goals,
                        }
                    )
                    logging.info(f"Processed {file_path.name} with goals: {normalized_goals}")
    return results


def main():
    project_goals = scan_project_files()
    try:
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(project_goals, f, indent=2)
        print(f"✅ Extracted {len(project_goals)} project(s) with goals.")
    except Exception as e:
        logging.error(f"Failed to write output JSON: {e}")


if __name__ == "__main__":
    main()
