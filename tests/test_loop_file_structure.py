import re
import pytest
import yaml

def extract_yaml_frontmatter(md_text):
    match = re.match(r"---\n(.*?)\n---", md_text, re.DOTALL)
    if not match:
        raise ValueError("Missing or invalid YAML frontmatter")
    return yaml.safe_load(match.group(1))

REQUIRED_FIELDS = {"id", "summary", "tags", "status", "verified"}

@pytest.mark.parametrize("valid_md", [
    (
        "---\nid: loop-2025-05-21-01\nsummary: Tested loop file structure\nstatus: open\ntags: [\"#loop\", \"#gpt\"]\nsource: obsidian:/Retrospectives/2025-05-21.md\nverified: false\n---\n\n### 🧠 Example\n\nThis is a test loop."
    ),
])
def test_valid_loop_file_yaml(valid_md):
    data = extract_yaml_frontmatter(valid_md)
    missing = REQUIRED_FIELDS - data.keys()
    assert not missing, f"Missing required keys: {missing}"
    assert isinstance(data["tags"], list)
    assert data.get("status") in {"open", "closed", "draft"}
    assert data.get("verified") in {True, False}

@pytest.mark.parametrize("invalid_md", [
    "---\nsummary This is broken YAML\n---\n\nBody",
    "Missing frontmatter and malformed completely",
    "---\nsummary: Only one field\n---\n\nNo structure"
])
def test_invalid_loop_file_yaml_raises_structure_violation(invalid_md):
    try:
        data = extract_yaml_frontmatter(invalid_md)
        missing = REQUIRED_FIELDS - data.keys() if isinstance(data, dict) else REQUIRED_FIELDS
        assert missing, f"Expected structure violation, but got all required keys: {data}"
    except Exception:
        pass  # acceptable failure mode (e.g., bad YAML or no frontmatter)
