
import frontmatter
from pathlib import Path
from datetime import datetime

LOOP_PATH = "/Users/air/AIR01/Retrospectives"
PROMOTE_THRESHOLD = 4.0
LOG_PATH = "/Users/air/AIR01/System/Logs/loop_promotions.md"

def promote_loop(file_path):
    post = frontmatter.load(file_path)
    weight = post.get("weight", 0)
    status = post.get("status", "open")

    if weight >= PROMOTE_THRESHOLD and status != "promoted":
        post["status"] = "promoted"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(frontmatter.dumps(post))
        with open(LOG_PATH, "a", encoding="utf-8") as log:
            log.write(f"{datetime.now().isoformat()} - Promoted {file_path.name} (weight: {weight})\n")
        print(f"✅ Promoted: {file_path.name}")
    else:
        print(f"ℹ️ No promotion needed for: {file_path.name}")

def main():
    for file in Path(LOOP_PATH).glob("*.md"):
        promote_loop(file)

if __name__ == "__main__":
    main()
