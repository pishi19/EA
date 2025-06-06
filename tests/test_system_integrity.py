import json
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

import pytest

from src.audit_orphans import find_orphan_loops, find_referenced_loops
from src.system.status_writer import write_status
from src.system.vault_index import _format_created, _parse_md, generate_vault_index


@pytest.fixture
def temp_vault(tmp_path):
    """Create a temporary vault directory structure for testing."""
    vault_path = tmp_path / "vault"
    retro_path = vault_path / "Retrospectives"
    hq_path = vault_path / "0001 HQ"
    daily_path = hq_path / "Daily Assistant"
    weekly_path = hq_path / "Weekly Assistant"

    retro_path.mkdir(parents=True, exist_ok=True)
    daily_path.mkdir(parents=True, exist_ok=True)
    weekly_path.mkdir(parents=True, exist_ok=True)

    # Create dummy loop files
    (retro_path / "loop-1.md").touch()
    (retro_path / "loop-2.md").touch()
    (retro_path / "loop-3.md").touch() # This one should be orphan

    # Create dummy reference files
    (daily_path / "daily-1.md").write_text("This references [[loop-1]]")
    (weekly_path / "weekly-1.md").write_text("This references [[loop-2]]")
    (hq_path / "Signal_Tasks.md").write_text("This also references [[loop-1]]")

    return vault_path

def test_vault_index_generation(tmp_path):
    index_out = tmp_path / "index.json"
    out = generate_vault_index(index_out=index_out)
    assert Path(out).exists()
    data = json.loads(Path(out).read_text())
    assert isinstance(data, list)
    # The fixture that creates the vault is not used here, so we expect an empty list
    assert data == []

def test_status_write():
    status = write_status("test_component", loop_id="loop-xyz", roadmap_id="R123", action="check")
    assert Path(status["path"]).exists()

def test_format_created():
    """Test the _format_created function."""
    assert _format_created("2023-01-01") == "2023-01-01"
    assert _format_created(1672531200) == "2023-01-01T00:00:00"
    dt = datetime(2023, 1, 1)
    assert _format_created(dt) == "2023-01-01T00:00:00"

def test_parse_md(tmp_path):
    """Test the _parse_md function."""
    # Test with a valid file
    file = tmp_path / "test.md"
    file.write_text("---\ntitle: test title\n---\ncontent")
    data = _parse_md(file)
    assert data["title"] == "test title"

    # Test with a file that has no frontmatter
    file.write_text("no frontmatter")
    data = _parse_md(file)
    assert data["title"] == "test"

    # Test with a file that causes an error
    with patch("src.system.vault_index.frontmatter.load", side_effect=Exception("test error")):
        data = _parse_md(file)
        assert data["error"] == "test error"

def test_generate_vault_index(tmp_path):
    """Test the generate_vault_index function."""
    loops_dir = tmp_path / "loops"
    loops_dir.mkdir()
    insights_dir = tmp_path / "insights"
    insights_dir.mkdir()
    index_out = tmp_path / "index.json"

    (loops_dir / "loop1.md").write_text("---\ntitle: loop1\n---\ncontent")
    (insights_dir / "insight1.md").write_text("---\ntitle: insight1\n---\ncontent")

    generate_vault_index(loops_dir=loops_dir, insights_dir=insights_dir, index_out=index_out)

    assert index_out.exists()
    data = json.loads(index_out.read_text())
    assert len(data) == 2
    assert data[0]["title"] in ["loop1", "insight1"]
    assert data[1]["title"] in ["loop1", "insight1"]

def test_find_referenced_loops(temp_vault, monkeypatch):
    """Test the find_referenced_loops function."""
    monkeypatch.setattr("src.audit_orphans.DAILY_PATH", temp_vault / "0001 HQ" / "Daily Assistant")
    monkeypatch.setattr("src.audit_orphans.WEEKLY_PATH", temp_vault / "0001 HQ" / "Weekly Assistant")
    monkeypatch.setattr("src.audit_orphans.TASKS_FILE", temp_vault / "0001 HQ" / "Signal_Tasks.md")

    referenced_loops = find_referenced_loops()
    assert referenced_loops == {"loop-1", "loop-2"}

def test_find_orphan_loops(temp_vault, monkeypatch):
    """Test the find_orphan_loops function."""
    monkeypatch.setattr("src.audit_orphans.RETRO_PATH", temp_vault / "Retrospectives")
    monkeypatch.setattr("src.audit_orphans.DAILY_PATH", temp_vault / "0001 HQ" / "Daily Assistant")
    monkeypatch.setattr("src.audit_orphans.WEEKLY_PATH", temp_vault / "0001 HQ" / "Weekly Assistant")
    monkeypatch.setattr("src.audit_orphans.TASKS_FILE", temp_vault / "0001 HQ" / "Signal_Tasks.md")

    orphan_loops = find_orphan_loops()
    assert orphan_loops == ["loop-3"]
