import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import frontmatter
import pandas as pd

# Add project root to path to allow importing from src
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(PROJECT_ROOT))


from src.agent.commands import promote_loop
from src.agent.commands.promote_loop import (
    find_loop_file_by_uuid,
    promote_loop_to_roadmap,
    suggest_roadmap_promotions,
)
from src.agent.commands.summarize_stream import summarize_stream
from src.agent.commands.volatility import summarize_volatility


def test_promote_loop_to_roadmap(test_env):
    """
    Tests the direct promotion of a single loop to a roadmap item.
    """
    # We need to temporarily point the function to our test environment
    # This is a bit of a hack, but necessary because the paths are hardcoded in the command
    original_root = promote_loop.PROJECT_ROOT
    promote_loop.PROJECT_ROOT = test_env['project_root']

    result = promote_loop.promote_loop_to_roadmap("loop_1_ws_1")

    assert result["status"] == "success"
    new_file_path = Path(result["file_path"])
    assert new_file_path.exists()

    post = frontmatter.load(new_file_path)
    assert post["origin_loop"] == "loop_1_ws_1"
    assert post["status"] == "proposed"

    # Restore the original path
    promote_loop.PROJECT_ROOT = original_root

def test_summarize_stream(test_env):
    """
    Tests the workstream summary command.
    """
    # This command uses a data loader which we can bypass by feeding the test DB path directly
    summary = summarize_stream("ws_1", db_path=test_env['db_path'])

    assert "error" not in summary
    assert summary["title"] == "Workstream One"
    assert summary["num_loops"] == 2
    assert len(summary["sample_loops"]) == 2

    # Check feedback counts for a specific loop
    loop1_summary = next(l for l in summary["sample_loops"] if l["uuid"] == "loop_1_ws_1")
    assert loop1_summary["feedback"]["positive"] == 2
    assert loop1_summary["feedback"]["negative"] == 0


def test_summarize_volatility(test_env):
    """
    Tests the feedback volatility summary command.
    """
    summary = summarize_volatility("ws_1", db_path=test_env['db_path'])

    assert "error" not in summary
    assert summary["total_loops"] == 2
    assert summary["untagged_loop_count"] == 0
    assert summary["volatile_loop_count"] == 2 # Both loops have a volatility of 1.0
    assert summary["average_feedback_per_loop"] == 1.5 # (2 feedback for loop1, 1 for loop2) / 2 loops

def test_summarize_stream_no_workstream(test_env):
    """
    Tests the workstream summary command for a non-existent workstream.
    """
    summary = summarize_stream("ws_none", db_path=test_env['db_path'])
    assert "error" in summary
    assert "not found" in summary["error"]

def test_summarize_volatility_no_loops(test_env):
    """
    Tests the feedback volatility summary command for a workstream with no loops.
    """
    summary = summarize_volatility("ws_3_empty", db_path=test_env['db_path'])
    assert "error" in summary
    assert "No loops" in summary["error"]

def test_summarize_volatility_no_feedback(test_env):
    """
    Tests the feedback volatility summary command for a workstream with no feedback.
    """
    summary = summarize_volatility("ws_4_no_feedback", db_path=test_env['db_path'])
    assert summary["untagged_loop_count"] == 1

def test_summarize_volatility_single_loop(test_env):
    """
    Tests the feedback volatility summary command for a workstream with a single loop.
    """
    summary = summarize_volatility("ws_5_single_loop", db_path=test_env['db_path'])
    assert summary["total_loops"] == 1

@patch("src.agent.commands.volatility.pd.read_sql", side_effect=Exception("DB error"))
def test_summarize_volatility_db_error(mock_read_sql, test_env):
    """
    Tests the feedback volatility summary command when there is a database error.
    """
    summary = summarize_volatility("ws_1", db_path=test_env['db_path'])
    assert "error" in summary
    assert "Database query failed" in summary["error"]

# Note: Testing OpenAI-dependent functions requires mocking the API, which is more advanced.
# For now, we will skip testing `index_task_verbs` and `find_similar_tasks` directly

def test_promote_non_existent_loop(mocker):
    mocker.patch('src.agent.commands.promote_loop.find_loop_file_by_uuid', return_value=None)
    result = promote_loop_to_roadmap("non-existent-uuid")
    assert result['status'] == 'error'
    assert "not found" in result['error']

def test_find_loop_file_by_uuid(tmp_path):
    """Test the find_loop_file_by_uuid function."""
    loops_dir = tmp_path / "loops"
    loops_dir.mkdir()

    # Test with a valid file
    (loops_dir / "loop1.md").write_text("---\nuuid: uuid1\n---\ncontent")
    assert find_loop_file_by_uuid("uuid1", loops_dir=loops_dir) is not None

    # Test with a non-existent file
    assert find_loop_file_by_uuid("uuid2", loops_dir=loops_dir) is None

    # Test with a directory that does not exist
    assert find_loop_file_by_uuid("uuid1", loops_dir=tmp_path / "non_existent_dir") is None

@patch("src.agent.commands.promote_loop.promote_loop_to_roadmap")
@patch("src.agent.commands.promote_loop.find_similar_tasks", return_value=["task1", "task2"])
@patch("src.agent.commands.promote_loop.pd.read_sql")
@patch("src.agent.commands.promote_loop.sqlite3.connect")
def test_suggest_roadmap_promotions(mock_connect, mock_read_sql, mock_find_similar_tasks, mock_promote_loop_to_roadmap, tmp_path):
    """Test the suggest_roadmap_promotions function."""
    db_path = tmp_path / "ora.db"

    # Mock the database
    mock_connect.return_value = MagicMock()

    # Mock the dataframes
    loops_df = pd.DataFrame({"uuid": ["uuid1"], "title": ["title1"]})
    feedback_df = pd.DataFrame({"tag": ["useful"]})
    mock_read_sql.side_effect = [loops_df, feedback_df]

    # Mock the promote_loop_to_roadmap function
    mock_promote_loop_to_roadmap.return_value = {"status": "success", "file_path": "test_file_path"}

    db_path.touch() # Ensure the db path exists
    result = suggest_roadmap_promotions("ws1", db_path=db_path)

    assert len(result["promoted_items"]) == 1
    assert result["promoted_items"][0]["title"] == "title1"

@patch("src.agent.commands.promote_loop.promote_loop_to_roadmap")
@patch("src.agent.commands.promote_loop.find_similar_tasks", return_value=[])
@patch("src.agent.commands.promote_loop.pd.read_sql")
@patch("src.agent.commands.promote_loop.sqlite3.connect")
def test_suggest_roadmap_promotions_no_feedback(mock_connect, mock_read_sql, mock_find_similar_tasks, mock_promote_loop_to_roadmap, tmp_path):
    """Test the suggest_roadmap_promotions function when there is no feedback."""
    db_path = tmp_path / "ora.db"

    # Mock the database
    mock_connect.return_value = MagicMock()

    # Mock the dataframes
    loops_df = pd.DataFrame({"uuid": ["uuid1"], "title": ["title1"]})
    feedback_df = pd.DataFrame({"tag": []})
    mock_read_sql.side_effect = [loops_df, feedback_df]

    # Mock the promote_loop_to_roadmap function
    mock_promote_loop_to_roadmap.return_value = {"status": "success", "file_path": "test_file_path"}

    db_path.touch() # Ensure the db path exists
    result = suggest_roadmap_promotions("ws1", db_path=db_path)

    assert len(result["promoted_items"]) == 1
    assert result["promoted_items"][0]["title"] == "title1"

# Note: Testing OpenAI-dependent functions requires mocking the API, which is more advanced.
# For now, we will skip testing `index_task_verbs` and `find_similar_tasks` directly
# as it would require setting up API keys in the test environment.
