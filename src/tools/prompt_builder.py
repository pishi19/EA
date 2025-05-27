import re
import json
from pathlib import Path
import os

# Always resolve paths relative to the project root
PROJECT_ROOT = Path(__file__).resolve().parents[2]
ROADMAP_MD = PROJECT_ROOT / "System/Reference/ea_roadmap.md"
ROADMAP_JSON = PROJECT_ROOT / "System/Reference/roadmap.json"
PROMPT_DIR = PROJECT_ROOT / "prompts"
PROMPT_DIR.mkdir(parents=True, exist_ok=True)

# Read the roadmap markdown
content = ROADMAP_MD.read_text(encoding="utf-8")

# Regex for roadmap blocks
block_re = re.compile(r"^## (.+?)\n(.*?)(?=^## |\Z)", re.DOTALL | re.MULTILINE)
field_re = re.compile(r"\*\*(.+?):\*\*\s*(.*)")

blocks = []
updated_blocks = []
json_blocks = []

for match in block_re.finditer(content):
    feature_title = match.group(1).strip()
    block_text = match.group(2).strip()
    fields = {"Feature": feature_title}
    lines = block_text.splitlines()
    i = 0
    # Parse bold fields
    while i < len(lines):
        line = lines[i].strip()
        m = field_re.match(line)
        if m:
            key, value = m.group(1).strip(), m.group(2).strip()
            # Multi-line Instructions
            if key == "Instructions":
                instr_lines = [value]
                i += 1
                while i < len(lines) and not field_re.match(lines[i]):
                    instr_lines.append(lines[i].strip())
                    i += 1
                value = "\n".join(instr_lines).strip()
                fields[key] = value
                continue
            fields[key] = value
        i += 1
    # Generate prompt if needed
    prompt_saved = fields.get("Prompt Saved", "No")
    if prompt_saved.lower() != "yes":
        # Generate prompt
        prompt = f"""You are in Cursor. Help the user implement this roadmap feature.\n\n## Feature\n{fields.get('Feature', '')} (ID: {fields.get('ID', '')})\n\n## File Target\n{fields.get('File Target', '')}\n\n## Instructions\n{fields.get('Instructions', '')}\n\nRespond with clean, documented Python code ready to drop into the target file."""
        prompt_path = PROMPT_DIR / f"{fields.get('ID', 'unknown')}_prompt.txt"
        prompt_path.write_text(prompt, encoding="utf-8")
        fields["Prompt Saved"] = "Yes"
    # Update block text
    block_lines = [f"## {fields.get('Feature', feature_title)}"]
    for key in ["ID", "Status", "Priority", "File Target", "Prompt Saved", "Executed", "Instructions"]:
        if key in fields:
            val = fields[key]
            if key == "Instructions":
                block_lines.append(f"**{key}:** {val}")
            else:
                block_lines.append(f"**{key}:** {val}")
    updated_blocks.append("\n".join(block_lines))
    # For JSON
    json_blocks.append(fields)

# Write updated markdown
new_content = "\n\n".join(updated_blocks)
ROADMAP_MD.write_text(new_content, encoding="utf-8")

# Write JSON
with ROADMAP_JSON.open("w", encoding="utf-8") as f:
    json.dump(json_blocks, f, indent=2, ensure_ascii=False) 