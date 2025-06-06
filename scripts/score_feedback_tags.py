from pathlib import Path

import yaml

loop_dir = Path("runtime/loops")
tag_weights = {
    "useful": 2,
    "needs_review": -1,
    "false_positive": -2,
    "duplicate": -3
}

loop_scores = {}

for file in loop_dir.glob("*.md"):
    content = file.read_text()
    if not content.startswith("---"):
        continue
    fm_end = content.index("---", 3)
    frontmatter = yaml.safe_load(content[3:fm_end])
    tags = frontmatter.get("feedback_tags", "")
    if isinstance(tags, str):
        tag_list = [tag.strip("#").strip() for tag in tags.split() if tag.startswith("#")]
    elif isinstance(tags, list):
        tag_list = tags
    else:
        tag_list = []

    score = sum(tag_weights.get(tag, 0) for tag in tag_list)
    loop_scores[file.name] = {
        "tags": tag_list,
        "score": score
    }
    print(f"📄 {file.name}: score = {score} | tags = {tag_list}")

with open("feedback_scores.yaml", "w") as f:
    yaml.dump(loop_scores, f)

print("✅ Scoring complete. Results saved to feedback_scores.yaml")
