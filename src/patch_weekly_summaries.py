import logging
import re
from pathlib import Path

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

WEEKLY_DIR = Path("/Users/air/AIR01/0001-HQ/Weekly Assistant")
INDEX_PATH = WEEKLY_DIR / "Weekly Index.md"


def patch_existing_summaries():
    summaries = sorted(WEEKLY_DIR.glob("20*-W*-summary.md"))
    links = []

    for summary_file in summaries:
        content = summary_file.read_text(encoding="utf-8")
        lines = content.splitlines()
        filename = summary_file.name
        updated_lines = []
        in_yaml = True
        loop_backlinks = []

        for line in lines:
            if in_yaml and line.strip() == "---":
                updated_lines.append(line)
                in_yaml = False
                continue

            if in_yaml:
                if line.strip().startswith("aliases:"):
                    updated_lines.append(line)
                    updated_lines.append("  - This Week")
                    continue
                updated_lines.append(line)
            else:
                if "loop-" in line and "[[loop-" not in line:
                    matches = re.findall(r"loop-[a-zA-Z0-9\-]+", line)
                    for m in matches:
                        loop_backlinks.append(f"[[{m}]]")
                updated_lines.append(line)

        # Add backlink section if relevant
        if loop_backlinks:
            updated_lines.append("\n## 🔁 Loop Backlinks")
            updated_lines.extend(f"- {link}" for link in sorted(set(loop_backlinks)))

        summary_file.write_text("\n".join(updated_lines), encoding="utf-8")
        links.append(f"- [[{filename}]]")

    # Write the index file
    with open(INDEX_PATH, "w", encoding="utf-8") as index:
        index.write("# 📅 Weekly Summary Index\n\n")
        index.write("\n".join(links))
    logger.info("✅ Weekly summaries patched and index written.")


if __name__ == "__main__":
    patch_existing_summaries()
