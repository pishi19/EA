from datetime import datetime
from pathlib import Path

from src.system.path_config import TAG_CLEANUP_LOG_FILE

FILES = {
    "/Users/air/AIR01/Retrospectives/loop-2025-05-20-assistant.md": [
        "loop",
        "snapshot",
        "assistant",
    ],
    "/Users/air/AIR01/Retrospectives/loop-2025-05-21-assistant.md": [
        "loop",
        "snapshot",
        "assistant",
    ],
    "/Users/air/AIR01/Retrospectives/loop-2025-05-20-email.md": [
        "email",
        "starred",
        "meeting",
        "payments",
    ],
}

def apply_tag_fixes(file_path, tags, log_path=TAG_CLEANUP_LOG_FILE):
    try:
        content = Path(file_path).read_text(encoding="utf-8").splitlines()
        new_lines = []
        replaced = False
        quoted_tags = [f'"{tag}"' for tag in tags]

        for line in content:
            if line.strip().startswith("tags:"):
                new_lines.append(f'tags: [{", ".join(quoted_tags)}]')
                replaced = True
            else:
                new_lines.append(line)

        if replaced:
            Path(file_path).write_text("\n".join(new_lines), encoding="utf-8")
            with open(log_path, "a", encoding="utf-8") as log:
                log.write(f"{datetime.now().isoformat()} - Fixed tags in: {file_path}\n")
            print(f"✅ Cleaned tags in: {file_path}")
        else:
            print(f"⚠️ No tags line found in: {file_path}")

    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")


def main(files_to_fix=FILES, log_path=TAG_CLEANUP_LOG_FILE):
    Path(log_path).parent.mkdir(parents=True, exist_ok=True)
    Path(log_path).write_text("🔧 Final Quoted Tags Fix Log\n\n")
    for path, tags in files_to_fix.items():
        apply_tag_fixes(path, tags, log_path=log_path)


if __name__ == "__main__":
    main()
