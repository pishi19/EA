
from pathlib import Path
from datetime import datetime

FILES = {
    "/Users/air/AIR01/Retrospectives/loop-2025-05-20-assistant.md": """---
id: loop-2025-05-20-assistant
summary: Assistant system snapshot for 2025-05-20
status: closed
type: snapshot
topic: system_vision
tags: [#loop, #snapshot, #assistant]
source: "obsidian:/0001 HQ/Daily Assistant/2025-05-20-assistant.md"
verified: false
---""",

    "/Users/air/AIR01/Retrospectives/loop-2025-05-21-assistant.md": """---
id: loop-2025-05-21-assistant
summary: Assistant system snapshot for 2025-05-21
status: open
type: snapshot
topic: system_vision
tags: [#loop, #snapshot, #assistant]
source: "obsidian:/0001 HQ/Daily Assistant/2025-05-21-assistant.md"
verified: false
---""",

    "/Users/air/AIR01/Retrospectives/loop-2025-05-20-email.md": """---
id: loop-2025-05-20-email
summary: Discussing details for the upcoming Recurring Payments Round Table dinner
tags: [#email, #starred, #meeting, #payments]
topic: Recurring Payments Round Table Dinner
status: open
source: "gmail:Recurring Payments Round Table Dinner"
created_at: 2025-05-20T10:00
---"""
}

LOG_PATH = "/Users/air/AIR01/System/Logs/raw_yaml_repair_log.md"

def overwrite_yaml(file_path, yaml_block):
    try:
        content = Path(file_path).read_text(encoding="utf-8")
        parts = content.split("---")
        if len(parts) >= 3:
            body = "---".join(parts[2:]).strip()
        else:
            body = ""
        new_content = f"{yaml_block}\n\n{body}"
        Path(file_path).write_text(new_content, encoding="utf-8")
        with open(LOG_PATH, "a", encoding="utf-8") as log:
            log.write(f"{datetime.now().isoformat()} - Rewrote YAML in {file_path}\n")
        print(f"✅ Rewrote YAML in: {file_path}")
    except Exception as e:
        print(f"❌ Error rewriting {file_path}: {e}")

def main():
    Path(LOG_PATH).parent.mkdir(parents=True, exist_ok=True)
    Path(LOG_PATH).write_text("🔧 Raw YAML Repair Log\n\n")
    for path, block in FILES.items():
        overwrite_yaml(path, block)

if __name__ == "__main__":
    main()
