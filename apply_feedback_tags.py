from pathlib import Path
import yaml

loop_dir = Path("runtime/loops")
tag_map_path = Path("suggested_feedback_tags.yaml")

if not tag_map_path.exists():
    raise FileNotFoundError("❌ suggested_feedback_tags.yaml not found.")

tag_map = yaml.safe_load(tag_map_path.read_text())

for file in loop_dir.glob("*.md"):
    content = file.read_text()
    if not content.startswith("---"):
        print(f"⚠️ Skipping {file.name} (no YAML frontmatter)")
        continue

    fm_end = content.index("---", 3)
    frontmatter = yaml.safe_load(content[3:fm_end])
    if not isinstance(frontmatter, dict):
        frontmatter = {}

    suggestion = tag_map.get(file.name)
    if suggestion:
        frontmatter["feedback_tags"] = suggestion.strip()
        updated = f"---\n{yaml.safe_dump(frontmatter, sort_keys=False)}---\n{content[fm_end+3:].lstrip()}"
        file.write_text(updated)
        print(f"✅ Injected feedback_tags into {file.name}: {suggestion.strip()}")
    else:
        print(f"⚠️ No tag suggestion found for {file.name}") 