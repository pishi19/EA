from datetime import datetime
from pathlib import Path

import frontmatter

FILES = [
    "/Users/air/AIR01/Retrospectives/loop-2025-05-20-assistant.md",
    "/Users/air/AIR01/Retrospectives/loop-2025-05-21-assistant.md",
    "/Users/air/AIR01/Retrospectives/loop-2025-05-20-email.md",
]

LOG_PATH = "/Users/air/AIR01/System/Logs/final_tag_fix_log.md"

FIXED_TAGS = {
    "loop-2025-05-20-assistant.md": ["#loop", "#snapshot", "#assistant"],
    "loop-2025-05-21-assistant.md": ["#loop", "#snapshot", "#assistant"],
    "loop-2025-05-20-email.md": ["#email", "#starred", "#meeting", "#payments"],
}


def fix_tags(file_path):
    file_name = Path(file_path).name
    try:
        post = frontmatter.load(file_path)
        post["tags"] = FIXED_TAGS.get(file_name, [])
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(frontmatter.dumps(post))
        with open(LOG_PATH, "a", encoding="utf-8") as log:
            log.write(f"{datetime.now().isoformat()} - Fixed tags in: {file_path}\n")
        print(f"✅ Fixed tags in: {file_path}")
    except Exception as e:
        with open(LOG_PATH, "a", encoding="utf-8") as log:
            log.write(f"{datetime.now().isoformat()} - ERROR in {file_path}: {e}\n")
        print(f"❌ Error fixing tags in {file_path}: {e}")


def main():
    Path(LOG_PATH).parent.mkdir(parents=True, exist_ok=True)
    Path(LOG_PATH).write_text("🛠 Final YAML Tag Fix Log\n\n")
    for path in FILES:
        fix_tags(path)


if __name__ == "__main__":
    main()
