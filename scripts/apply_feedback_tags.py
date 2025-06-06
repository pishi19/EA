from pathlib import Path
from datetime import datetime

import yaml
import frontmatter

def apply_tags_to_file(file_path, tags_to_apply, log_path):
    """Applies a list of tags to the frontmatter of a markdown file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            post = frontmatter.load(f)

        if "tags" not in post.metadata:
            post.metadata["tags"] = []

        for tag in tags_to_apply:
            if tag not in post.metadata["tags"]:
                post.metadata["tags"].append(tag)

        with open(file_path, "w", encoding="utf-8") as f:
            frontmatter.dump(post, f)
        
        with open(log_path, "a", encoding="utf-8") as log:
            log.write(f"{datetime.now().isoformat()} - Applied tags to: {file_path}\n")

        print(f"✅ Applied tags to {Path(file_path).name}")

    except Exception as e:
        print(f"❌ Error applying tags to {Path(file_path).name}: {e}")

def main(loop_dir, tag_map_path, log_path):
    if not tag_map_path.exists():
        raise FileNotFoundError("❌ suggested_feedback_tags.yaml not found.")

    tag_map = yaml.safe_load(tag_map_path.read_text())

    for file in loop_dir.glob("*.md"):
        suggestion = tag_map.get(file.name)
        if suggestion:
            apply_tags_to_file(file, [suggestion.strip()], log_path)
        else:
            print(f"⚠️ No tag suggestion found for {file.name}")

if __name__ == "__main__":
    loop_dir = Path("runtime/loops")
    tag_map_path = Path("suggested_feedback_tags.yaml")
    log_path = Path("logs/apply_feedback_tags.log")
    log_path.parent.mkdir(parents=True, exist_ok=True)
    main(loop_dir, tag_map_path, log_path)
