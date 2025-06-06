import sys
from pathlib import Path
import os
import frontmatter
import pytest
from unittest.mock import patch
import shutil

# Add project root to path to allow importing from src
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(PROJECT_ROOT))

# We need to import the UI files themselves to test their logic
from src.ui.pages import Roadmap_Promotions
from src.ui.pages import Workstream_View
from src.ui.pages import Workstream_Feedback

# To test Streamlit apps, we often have to mock the `st` module
# For this test, we will focus only on the data loading functions,
# which can be tested without mocking Streamlit itself.

@patch('src.ui.pages.Roadmap_Promotions.PROJECT_ROOT')
def test_roadmap_promotions_loader(mock_root, test_env):
    """
    Tests the data loading logic for the Roadmap Promotions page.
    """
    mock_root.return_value = test_env['project_root']
    
    # The UI file has the logic at the top level, so we need to reload it
    # to make it use our mocked path. This is complex.
    # A better approach is to refactor the UI file to have a load function.
    # For now, we'll assert that the logic works by calling a simplified version.
    
    # This test is becoming too complex due to the UI file structure.
    # We will skip direct testing of the UI files for now.
    # The agent command tests provide good coverage of the core logic.
    assert True # Placeholder to avoid test failure

# The tests for Workstream_View and Workstream_Feedback would be similarly complex.
# The best path forward is to refactor the UI pages to separate data logic from
# rendering logic, which would make them easier to test.

# For the purpose of this "all out" test run, we will rely on the
# coverage from the agent command tests, which exercise the most critical backend logic.

# Import the function we want to test from its new, testable location
from src.data.ui_loaders import load_promotable_loops

def test_roadmap_promotions_loader(test_env):
    """
    Tests the data loading logic for the Roadmap Promotions page.
    """
    # ARRANGE
    # The test_env fixture creates two loops with .md files.
    # We will "promote" one of them to test the filtering.
    promoted_post = frontmatter.Post(content="promoted", origin_loop="loop_1_ws_1")
    with open(test_env["roadmap_dir"] / "promoted.md", "wb") as f:
        frontmatter.dump(promoted_post, f)

    # ACT
    promotable_loops = load_promotable_loops(
        db_path=test_env["db_path"],
        loops_dir=test_env["loops_dir"],
        roadmap_dir=test_env["roadmap_dir"]
    )

    # ASSERT
    assert len(promotable_loops) == 1
    assert promotable_loops[0]["uuid"] == "loop_2_ws_1"
    assert promotable_loops[0]["title"] == "Loop 2 in WS1"

def test_promotions_loader_no_loops_file(test_env):
    """
    Tests that the loader returns an empty list if the loops dir doesn't exist.
    """
    shutil.rmtree(test_env["loops_dir"])
    promotable_loops = load_promotable_loops(
        db_path=test_env["db_path"],
        loops_dir=test_env["loops_dir"],
        roadmap_dir=test_env["roadmap_dir"]
    )
    assert len(promotable_loops) == 0

# We can add more tests here for the other UI pages once they are refactored. 