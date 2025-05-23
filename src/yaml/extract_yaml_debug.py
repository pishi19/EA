

FILES = [
    "/Users/air/AIR01/Retrospectives/loop-2025-05-21-**summary:**-trial-users-are-e.md",
    "/Users/air/AIR01/Retrospectives/loop-2025-05-20-assistant.md",
    "/Users/air/AIR01/Retrospectives/loop-2025-05-21-assistant.md",
    "/Users/air/AIR01/Retrospectives/loop-2025-05-20-email.md"
]

def extract_yaml(path):
    print(f"📂 Checking: {path}")
    try:
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        # Extract the YAML block manually
        if lines[0].strip() != "---":
            print("❌ No YAML frontmatter found.")
            return

        yaml_block = []
        for line in lines[1:]:
            if line.strip() == "---":
                break
            yaml_block.append(line)

        print("🧾 YAML frontmatter:")
        print("".join(yaml_block))
        print("—" * 40)

    except Exception as e:
        print(f"❌ Error reading {path}: {e}")

def main():
    for file in FILES:
        extract_yaml(file)

if __name__ == "__main__":
    main()
