
from pathlib import Path
import frontmatter
from datetime import datetime

FILE = "/Users/air/AIR01/Retrospectives/loop-2025-05-20-email.md"
LOG = "/Users/air/AIR01/System/Logs/yaml_created_at_fix_log.md"

def fix_created_at():
    try:
        post = frontmatter.load(FILE)
        created_at = post.get("created_at")
        if created_at and "<" in str(created_at):
            post["created_at"] = datetime.now().strftime("%Y-%m-%dT%H:%M")
            with open(FILE, "w", encoding="utf-8") as f:
                f.write(frontmatter.dumps(post))
            with open(LOG, "a", encoding="utf-8") as log:
                log.write(f"{datetime.now().isoformat()} - Fixed created_at in {FILE}\n")
            print(f"✅ Fixed created_at in: {FILE}")
        else:
            print(f"✅ No fix needed for: {FILE}")
    except Exception as e:
        print(f"❌ Error processing {FILE}: {e}")

if __name__ == "__main__":
    fix_created_at()
