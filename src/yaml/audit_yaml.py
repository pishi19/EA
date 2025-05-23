
from pathlib import Path

import frontmatter

RETRO_PATH = Path("/Users/air/AIR01/Retrospectives")
REPORT = Path("/Users/air/AIR01/System/Dashboards/loop_audit_dashboard.md")

def audit_yaml_structure():
    issues = []

    for file in RETRO_PATH.glob("loop-*.md"):
        try:
            post = frontmatter.load(file)
            loop_id = post.get("id", file.stem)
            if not post.get("id"):
                issues.append(f"- ❌ Missing `id:` → {file.name}")
            if not post.get("status"):
                issues.append(f"- ❌ Missing `status:` → {loop_id}")
            if not post.get("tags"):
                issues.append(f"- ❌ Missing `tags:` → {loop_id}")
            if "weight" not in post:
                issues.append(f"- ⚠️ Missing `weight:` → {loop_id}")
        except Exception as e:
            issues.append(f"- ❌ Failed to parse YAML → {file.name}: {e}")

    return issues
