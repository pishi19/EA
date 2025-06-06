import re
from collections import Counter
from pathlib import Path

loop_dir = Path("runtime/loops")
tag_pattern = re.compile(r"#(useful|false_positive|duplicate|needs_review)")

tag_counts = Counter()
loop_tags = {}

for file in loop_dir.glob("*.md"):
    content = file.read_text()
    matches = tag_pattern.findall(content)
    tag_counts.update(matches)
    loop_tags[file.name] = matches
    print(f"📄 {file.name}: {matches}")

print("\n📊 Total Tag Summary:")
for tag, count in tag_counts.items():
    print(f"#{tag}: {count}")
