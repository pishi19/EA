from pathlib import Path

# Define the files to include
VISION_FILES = [
    Path("/Users/air/AIR01/System/Ora/Ora-System.md"),
    Path("/Users/air/AIR01/System/Reference/EA-Vision.md"),
]


def load_vision_documents() -> str:
    contents = []
    for path in VISION_FILES:
        if path.exists():
            try:
                with path.open("r") as f:
                    content = f.read().strip()
                    contents.append(f"# {path.stem}\n{content}")
            except Exception as e:
                contents.append(f"# {path.stem}\n[Error reading file: {e}]")
        else:
            contents.append(f"# {path.stem}\n[File not found: {path}]")
    return "\n\n".join(contents)


# CLI usage
if __name__ == "__main__":
    print(load_vision_documents())
