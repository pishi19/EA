import hashlib
from pathlib import Path

import yaml

loop_dir = Path("runtime/loops")
manifest = {}

for file in loop_dir.glob("*.md"):
    content = file.read_bytes()
    sha256 = hashlib.sha256(content).hexdigest()
    filename = file.name
    front = file.read_text().split("---", 2)[1]
    try:
        frontmatter = yaml.safe_load(front)
    except Exception:
        frontmatter = {}

    manifest[filename] = {
        "sha256": sha256,
        "id": frontmatter.get("id", None),
        "feedback_tags": frontmatter.get("feedback_tags", None)
    }

with open(".system_manifest.yaml", "w") as f:
    yaml.dump(manifest, f)

print("✅ System manifest written to .system_manifest.yaml")
