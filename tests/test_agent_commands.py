import sys
from pathlib import Path
import os
import frontmatter
import pytest

# Add project root to path to allow importing from src
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(PROJECT_ROOT))

from src.agent.commands import promote_loop
from src.agent.commands.summarize_stream import summarize_stream
from src.agent.commands.volatility import summarize_volatility
from src.tasks.semantic_task_index import index_task_verbs
from src.tasks.similarity import find_similar_tasks

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

# Note: Testing OpenAI-dependent functions requires mocking the API, which is more advanced.
# For now, we will skip testing `index_task_verbs` and `find_similar_tasks` directly
# as it would require setting up API keys in the test environment. 

def test_promote_non_existent_loop(test_env):
    """
    Tests that promoting a loop without a corresponding .md file fails gracefully.
    """
    original_root = promote_loop.PROJECT_ROOT
    promote_loop.PROJECT_ROOT = test_env['project_root']

    # 'loop_3_ws_2' exists in the DB but we did not create a .md file for it
    result = promote_loop.promote_loop_to_roadmap("loop_3_ws_2")
    
    assert result["status"] == "error"
    assert "not found in any .md file" in result["error"]

    promote_loop.PROJECT_ROOT = original_root

# Note: Testing OpenAI-dependent functions requires mocking the API, which is more advanced.
# For now, we will skip testing `index_task_verbs` and `find_similar_tasks` directly
# as it would require setting up API keys in the test environment. 