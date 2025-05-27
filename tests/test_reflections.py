import pytest
import yaml
from pathlib import Path

RETRO_DIR = Path(__file__).parent.parent / "Retrospectives"

@pytest.mark.parametrize("retro_file", list(RETRO_DIR.glob("*.md")))
def test_retrospective_file_structure(retro_file):
    content = retro_file.read_text(encoding="utf-8")
    # Split on first two ---
    parts = content.split('---')
    assert len(parts) >= 3, f"{retro_file.name} missing YAML frontmatter."
    yaml_block = parts[1].strip()
    body = '---'.join(parts[2:]).strip()
    meta = yaml.safe_load(yaml_block)
    # Check required YAML fields
    for field in ["roadmap_id", "feature", "file_target", "executed_on"]:
        assert field in meta, f"{retro_file.name} missing YAML field: {field}"
    # Check markdown body for ## Reflection section
    reflection_lines = []
    in_reflection = False
    for line in body.splitlines():
        if line.strip().startswith("## Reflection"):
            in_reflection = True
            continue
        if in_reflection:
            if line.strip().startswith("## "):
                break
            if line.strip():
                reflection_lines.append(line.strip())
    assert reflection_lines, f"{retro_file.name} missing content under ## Reflection section." 