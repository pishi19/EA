from datetime import datetime
from pathlib import Path

# Config
SIGNAL_TASKS_PATH = "/Users/air/AIR01/0001 HQ/Signal_Tasks.md"


def append_task(source: str, description: str, link: str = None):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    task_line = f"- [ ] {description}"
    if link:
        task_line += f" — [View source]({link})"

    # Read file
    path = Path(SIGNAL_TASKS_PATH)
    if not path.exists():
        print(f"❌ HQ task file not found: {SIGNAL_TASKS_PATH}")
        return

    with open(path) as f:
        lines = f.readlines()

    # Insert into correct section
    section_header = f"## {source}"
    section_index = next(
        (i for i, line in enumerate(lines) if line.strip() == section_header), None
    )

    if section_index is not None:
        insert_index = section_index + 1
        while insert_index < len(lines) and lines[insert_index].strip().startswith("- ["):
            insert_index += 1
        lines.insert(insert_index, task_line + "\n")
    else:
        # Create section if missing
        lines.insert(2, f"{section_header}\n{task_line}\n\n")

    # Update timestamp
    for i, line in enumerate(lines):
        if line.startswith("_Last updated:"):
            lines[i] = f"_Last updated: {timestamp}_\n"
            break

    with open(path, "w") as f:
        f.writelines(lines)

    print(f"✅ Task appended to HQ under {source}")


# Example usage:
# append_task("📨 Email", "Follow up with Jane on pricing", "https://mail.google.com/mail/u/0/#all/abc123")

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python3 task_signal_router.py <source> <description> [link]")
        sys.exit(1)
    source = sys.argv[1]
    description = sys.argv[2]
    link = sys.argv[3] if len(sys.argv) == 4 else None
    append_task(source, description, link)
