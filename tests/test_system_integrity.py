from src.system.vault_index import generate_vault_index
from src.system.status_writer import write_status
from pathlib import Path
import json

def test_vault_index_generation():
    out = generate_vault_index()
    assert Path(out).exists()
    data = json.loads(Path(out).read_text())
    assert isinstance(data, list)
    assert all("created" in entry for entry in data)

def test_status_write():
    status = write_status("test_component", loop_id="loop-xyz", roadmap_id="R123", action="check")
    assert Path(status["path"]).exists()
