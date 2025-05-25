from pathlib import Path

import frontmatter

FILE_PATH = "/Users/air/AIR01/Retrospectives/loop-2025-05-21-**summary:**-trial-users-are-e.md"
FIXED_PATH = "/Users/air/AIR01/Retrospectives/loop-2025-05-21-summary-trial-users-are-e.md"


def fix_metadata():
    post = frontmatter.load(FILE_PATH)

    # Fix ID
    post["id"] = "loop-2025-05-21-summary-trial-users-are-e"

    # Fix tags (ensure plain strings, remove asterisks)
    post["tags"] = [
        "Billing",
        "Trial Users",
        "Subscription Transition",
        "User Experience",
        "Communication",
    ]

    # Fix priority
    if "priority" in post:
        post["priority"] = str(post["priority"]).replace("*", "").strip()

    # Save to new file path with clean filename
    with open(FIXED_PATH, "w", encoding="utf-8") as f:
        f.write(frontmatter.dumps(post))

    # Remove old file
    Path(FILE_PATH).unlink()
    print(f"✅ Fixed and renamed: {FIXED_PATH}")


if __name__ == "__main__":
    fix_metadata()
