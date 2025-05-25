FILE_PATH = "/Users/air/AIR01/Retrospectives/loop-2025-05-20-email.md"
LOG_PATH = "/Users/air/AIR01/System/Logs/yaml_email_hardfix_log.md"

correct_yaml = """---
id: loop-2025-05-20-email
summary: Discussing details for the upcoming Recurring Payments Round Table dinner
tags: [#email, #starred, #meeting, #payments]
topic: Recurring Payments Round Table Dinner
status: open
source: gmail:Recurring Payments Round Table Dinner
created_at: 2025-05-20T10:00
---"""


def replace_yaml():
    try:
        with open(FILE_PATH, encoding="utf-8") as f:
            content = f.read()

        # Extract everything after the second ---
        after = content.split("---", 2)[-1].strip()
        fixed = correct_yaml + "\n\n" + after

        with open(FILE_PATH, "w", encoding="utf-8") as f:
            f.write(fixed)

        with open(LOG_PATH, "a", encoding="utf-8") as log:
            log.write(f"✅ {FILE_PATH} frontmatter replaced successfully\n")

        print("✅ YAML frontmatter replaced successfully.")

    except Exception as e:
        print(f"❌ Failed to fix file: {e}")


if __name__ == "__main__":
    replace_yaml()
