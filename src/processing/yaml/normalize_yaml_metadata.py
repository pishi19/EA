from pathlib import Path

import frontmatter

BASE_PATHS = [
    "/Users/air/AIR01/02 Workstreams/Programs",
    "/Users/air/AIR01/02 Workstreams/Projects",
]


def normalize_yaml(path, type_):
    for file in Path(path).glob("*.md"):
        post = frontmatter.load(file)
        post["id"] = post.get("id", f"{type_}-{file.stem}")
        post["type"] = type_
        post["status"] = post.get("status", "active")
        post["goal"] = post.get("goal", "Add your goal here")
        post["tags"] = post.get("tags", [])
        with open(file, "w", encoding="utf-8") as f:
            f.write(frontmatter.dumps(post))
        print(f"✅ Normalized YAML: {file.name}")


def main():
    normalize_yaml(BASE_PATHS[0], "program")
    normalize_yaml(BASE_PATHS[1], "project")


if __name__ == "__main__":
    main()
