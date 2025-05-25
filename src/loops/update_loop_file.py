import os
import re
import sys
from pathlib import Path

import ruamel.yaml

# Configuration
LOOP_DIR = "/Users/air/AIR01/Retrospectives/loops"
yaml_parser = ruamel.yaml.YAML()


def clamp(value, min_value=0.0, max_value=1.0):
    return max(min(value, max_value), min_value)


def update_loop_file(loop_id, feedback_type):
    loop_path = Path(LOOP_DIR) / f"{loop_id}.md"
    if not loop_path.exists():
        print(f"❌ Loop file not found: {loop_path}")
        return

    with open(loop_path) as f:
        content = f.read()

    match = re.search(r"^---\n(.*?)\n---\n", content, re.DOTALL)
    if not match:
        print(f"❌ YAML frontmatter not found in: {loop_id}")
        return

    yaml_text = match.group(1)
    yaml_data = yaml_parser.load(yaml_text)

    # Update values
    yaml_data["verified"] = True
    current_strength = yaml_data.get("signal_strength", 0.5)
    if feedback_type == "useful":
        yaml_data["signal_strength"] = clamp(current_strength + 0.1)
    elif feedback_type == "noise":
        yaml_data["signal_strength"] = clamp(current_strength - 0.1)

    # Rewrite updated YAML
    new_yaml = Path("/tmp") / f"{loop_id}_temp.md"
    with open(new_yaml, "w") as f:
        yaml_parser.dump(yaml_data, f)
        f.write("---\n")
        f.write(content.split("---\n", 2)[2])  # Rest of the file after YAML

    # Overwrite original
    os.replace(new_yaml, loop_path)
    print(f"✅ Updated loop file: {loop_id}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 update_loop_file.py <loop_id> <feedback_type>")
        sys.exit(1)
    update_loop_file(sys.argv[1], sys.argv[2])
