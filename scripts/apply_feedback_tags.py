from pathlib import Path

import frontmatter
import yaml

loop_dir = Path("runtime/loops")
tag_map_path = Path("suggested_feedback_tags.yaml")

if not tag_map_path.exists():
    raise FileNotFoundError("❌ suggested_feedback_tags.yaml not found.")

tag_map = yaml.safe_load(tag_map_path.read_text())

def apply_tags_to_file(file_path, tags_to_apply):
    """Applies a list of tags to the frontmatter of a markdown file."""
    try:
        with open(file_path, encoding="utf-8") as f:
            post = frontmatter.load(f)

        if "tags" not in post.metadata:
            post.metadata["tags"] = []

        for tag in tags_to_apply:
            if tag not in post.metadata["tags"]:
                post.metadata["tags"].append(tag)

        with open(file_path, "w", encoding="utf-8") as f:
            frontmatter.dump(post, f)

        print(f"✅ Applied tags to {Path(file_path).name}")

    except Exception as e:
        print(f"❌ Error applying tags to {Path(file_path).name}: {e}")

for file in loop_dir.glob("*.md"):
    content = file.read_text()
    if not content.startswith("---"):
        print(f"⚠️ Skipping {file.name} (no YAML frontmatter)")
        continue

    fm_end = content.index("---", 3)
    frontmatter_content = yaml.safe_load(content[3:fm_end])
    if not isinstance(frontmatter_content, dict):
        frontmatter_content = {}

    suggestion = tag_map.get(file.name)
    if suggestion:
        frontmatter_content["feedback_tags"] = suggestion.strip()
        updated = (
            f"---\n{yaml.safe_dump(frontmatter_content, sort_keys=False)}---\n"
            f"{content[fm_end+3:].lstrip()}"
        )
        file.write_text(updated)
        print(f"✅ Injected feedback_tags into {file.name}: {suggestion.strip()}")
    else:
        print(f"⚠️ No tag suggestion found for {file.name}")
