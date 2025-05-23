

FILES = [
    "/Users/air/AIR01/Retrospectives/loop-2025-05-20-assistant.md",
    "/Users/air/AIR01/Retrospectives/loop-2025-05-21-assistant.md",
    "/Users/air/AIR01/Retrospectives/loop-2025-05-20-email.md"
]

def dump_raw_yaml(file_path):
    print(f"📂 File: {file_path}")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        if lines[0].strip() != "---":
            print("❌ No YAML frontmatter found.")
            return

        print("🧾 Raw YAML block:")
        for line in lines[1:]:
            if line.strip() == "---":
                break
            print(line.rstrip())
        print("—" * 40)

    except Exception as e:
        print(f"❌ Failed to read {file_path}: {e}")

def main():
    for file in FILES:
        dump_raw_yaml(file)

if __name__ == "__main__":
    main()
