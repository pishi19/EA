import pytest
import re
from pathlib import Path

ROADMAP_PATH = Path(__file__).parent.parent / "System/Reference/ea_roadmap.md"
REQUIRED_FIELDS = ["**ID:**", "**Status:**", "**File Target:**", "**Instructions:**"]


def test_roadmap_blocks():
    content = ROADMAP_PATH.read_text(encoding="utf-8")
    # Split on roadmap blocks (start with ## )
    blocks = re.split(r"^## ", content, flags=re.MULTILINE)
    malformed = []
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        lines = block.splitlines()
        header = lines[0] if lines else ""
        missing = [field for field in REQUIRED_FIELDS if field not in block]
        if not header or missing:
            malformed.append((header, missing))
    if malformed:
        for header, missing in malformed:
            print(f"Malformed block: '{header}' missing fields: {missing}")
    assert not malformed, f"Malformed roadmap blocks found: {malformed}" 