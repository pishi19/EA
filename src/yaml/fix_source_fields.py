
from datetime import datetime
from pathlib import Path

import frontmatter

RETRO_PATH = "/Users/air/AIR01/Retrospectives"
LOG_PATH = "/Users/air/AIR01/System/Logs/yaml_source_autofix_log.md"

def quote_source_field(post):
    source = post.get("source")
    if source and isinstance(source, str) and (":" in source or "/" in source or " " in source):
        if not (source.startswith('"') and source.endswith('"')):
            post["source"] = f"{source.strip()}"
            return True
    return False

def fix_source_in_file(file_path):
    try:
        post = frontmatter.load(file_path)
    except Exception as e:
        with open(LOG_PATH, "a", encoding="utf-8") as log:
            log.write(f"{datetime.now().isoformat()} - Failed to load {file_path}: {e}\n")
        return

    if quote_source_field(post):
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(frontmatter.dumps(post))
        with open(LOG_PATH, "a", encoding="utf-8") as log:
            log.write(f"{datetime.now().isoformat()} - Fixed source in: {file_path}\n")
        print(f"✅ Fixed source: {file_path}")
    else:
        print(f"✅ No change needed: {file_path}")

def main():
    Path(LOG_PATH).parent.mkdir(parents=True, exist_ok=True)
    Path(LOG_PATH).write_text("🛠 YAML Source Autofix Log\n\n")

    for file in Path(RETRO_PATH).glob("*.md"):
        fix_source_in_file(file)

    print("✅ Completed source field scan.")

if __name__ == "__main__":
    main()
