from pathlib import Path

import frontmatter


def load_roadmap_items(roadmap_dir="Roadmap"):
    items = []
    folder = Path(__file__).resolve().parent.parent / roadmap_dir

    if not folder.exists():
        print(f"❌ Roadmap folder not found: {folder}")
        return items

    for file in folder.glob("*.md"):
        try:
            post = frontmatter.load(file)
            item = {
                "id": post.get("id") or post.get("ID") or file.stem,
                "feature": post.get("feature") or post.get("Feature", "Unnamed Feature"),
                "status": post.get("status", "open"),
                "instructions": post.get("instructions", "").strip(),
                "file_path": str(file)
            }
            items.append(item)
        except Exception as e:
            print(f"❌ Failed to load {file.name}: {e}")

    print(f"✅ Loaded {len(items)} roadmap items from {roadmap_dir}")
    return items
