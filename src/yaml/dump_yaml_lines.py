

FILES = [
    "/Users/air/AIR01/Retrospectives/loop-2025-05-20-assistant.md",
    "/Users/air/AIR01/Retrospectives/loop-2025-05-21-assistant.md",
    "/Users/air/AIR01/Retrospectives/loop-2025-05-20-email.md"
]

def dump_yaml_lines(file_path):
    print(f"📂 {file_path}")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        if not lines[0].strip() == "---":
            print("❌ No YAML block found")
            return

        for idx, line in enumerate(lines, 1):
            print(f"{idx:>2}: {line.rstrip()}")

        print("—" * 40)
    except Exception as e:
        print(f"❌ Failed to read {file_path}: {e}")

def main():
    for file in FILES:
        dump_yaml_lines(file)

if __name__ == "__main__":
    main()
