import re
from datetime import datetime
from pathlib import Path

import frontmatter

RETRO_PATH = "/Users/air/AIR01/Retrospectives"
LOG_PATH = "/Users/air/AIR01/System/Logs/yaml_autofix_log.md"


def fix_tags(tags):
    if not isinstance(tags, list):
        return []
    fixed = []
    for tag in tags:
        if isinstance(tag, str) and re.match(r"^#[a-zA-Z0-9_\-]+$", tag):
            fixed.append(tag)
    return list(set(fixed))


def fix_yaml_metadata(file_path):
    try:
        post = frontmatter.load(file_path)
    except Exception as e:
        with open(LOG_PATH, "a", encoding="utf-8") as log:
            log.write(f"{datetime.now().isoformat()} - FAILED TO LOAD: {file_path} - {e}\n")
        return False

    modified = False

    # Fix malformed 'summary' keys
    for key in list(post.keys()):
        if "**" in key:
            clean_key = key.replace("**", "").replace(":", "").strip()
            post[clean_key] = post[key]
            del post[key]
            modified = True

    # Fix malformed tag sequences
    if "tags" in post:
        original = post["tags"]
        fixed = fix_tags(original)
        if fixed != original:
            post["tags"] = fixed
            modified = True

    if modified:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(frontmatter.dumps(post))
        with open(LOG_PATH, "a", encoding="utf-8") as log:
            log.write(f"{datetime.now().isoformat()} - FIXED: {file_path}\n")

    return modified


def main():
    Path(LOG_PATH).parent.mkdir(parents=True, exist_ok=True)
    Path(LOG_PATH).write_text("🛠 YAML Autofix Log\n\n")

    for file in Path(RETRO_PATH).glob("*.md"):
        fix_yaml_metadata(file)

    print("✅ YAML autofix complete. See log for results.")


if __name__ == "__main__":
    main()
