
from pathlib import Path
import frontmatter
import re
from datetime import datetime

FILES = [
    "/Users/air/AIR01/Retrospectives/loop-2025-05-20-assistant.md",
    "/Users/air/AIR01/Retrospectives/loop-2025-05-21-assistant.md",
    "/Users/air/AIR01/Retrospectives/loop-2025-05-20-email.md"
]

LOG_PATH = "/Users/air/AIR01/System/Logs/yaml_tag_autofix_log.md"

def clean_tags_field(tags):
    if not isinstance(tags, list):
        return []
    cleaned = []
    for tag in tags:
        if isinstance(tag, str):
            tag = tag.strip()
            if tag and re.match(r"^#?[\w\-]+$", tag):
                cleaned.append(tag if tag.startswith("#") else "#" + tag)
    return list(set(cleaned))

def fix_tags_in_file(file_path):
    try:
        post = frontmatter.load(file_path)
    except Exception as e:
        with open(LOG_PATH, "a", encoding="utf-8") as log:
            log.write(f"{datetime.now().isoformat()} - Failed to load {file_path}: {e}\n")
        return

    if "tags" in post:
        original = post["tags"]
        cleaned = clean_tags_field(original)
        post["tags"] = cleaned
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(frontmatter.dumps(post))
        with open(LOG_PATH, "a", encoding="utf-8") as log:
            log.write(f"{datetime.now().isoformat()} - Fixed tags in {file_path}: {original} → {cleaned}\n")

def main():
    Path(LOG_PATH).parent.mkdir(parents=True, exist_ok=True)
    Path(LOG_PATH).write_text("🛠 YAML Tag Autofix Log\n\n")
    for file_path in FILES:
        fix_tags_in_file(file_path)
    print("✅ Tags cleaned in all target files.")

if __name__ == "__main__":
    main()
