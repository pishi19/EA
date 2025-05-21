import pytest

# Simulated loop records (e.g., parsed from Obsidian or memory DB)
mock_loops = {
    "loop-001": {"status": "open", "verified": False},
    "loop-002": {"status": "closed", "verified": True},
    "loop-003": {"status": "draft", "verified": False},
}

def mark_loop_status(loop_id, new_status):
    if loop_id not in mock_loops:
        raise KeyError(f"Loop {loop_id} not found")
    mock_loops[loop_id]["status"] = new_status

def toggle_verified(loop_id):
    if loop_id not in mock_loops:
        raise KeyError(f"Loop {loop_id} not found")
    mock_loops[loop_id]["verified"] = not mock_loops[loop_id]["verified"]

def test_mark_loop_status_change():
    mark_loop_status("loop-001", "closed")
    assert mock_loops["loop-001"]["status"] == "closed"

def test_toggle_verified_flag():
    toggle_verified("loop-003")
    assert mock_loops["loop-003"]["verified"] is True
    toggle_verified("loop-003")
    assert mock_loops["loop-003"]["verified"] is False

def test_loop_control_invalid_loop():
    with pytest.raises(KeyError):
        mark_loop_status("loop-999", "open")
    with pytest.raises(KeyError):
        toggle_verified("loop-999")
