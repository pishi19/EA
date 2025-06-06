from unittest.mock import MagicMock, patch

import pytest

from src.data.ui_loaders import load_promotable_loops


@pytest.fixture
def temp_dirs(tmp_path):
    """Create temporary directories for testing."""
    loops_dir = tmp_path / "loops"
    loops_dir.mkdir()
    roadmap_dir = tmp_path / "roadmap"
    roadmap_dir.mkdir()
    db_path = tmp_path / "ora.db"
    return db_path, loops_dir, roadmap_dir

@patch("src.data.ui_loaders.sqlite3.connect")
def test_load_promotable_loops(mock_connect, temp_dirs):
    """Test the load_promotable_loops function."""
    db_path, loops_dir, roadmap_dir = temp_dirs

    # Mock the database
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    mock_connect.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cur
    mock_cur.fetchall.return_value = [("uuid1", "title1", "workstream1", 1.0)]

    # Create dummy files
    (loops_dir / "loop1.md").write_text("---\nuuid: uuid1\n---\ncontent")
    (roadmap_dir / "roadmap1.md").write_text("---\norigin_loop: uuid2\n---\ncontent")

    db_path.touch() # Ensure the db path exists
    loops = load_promotable_loops(db_path, loops_dir, roadmap_dir)

    assert len(loops) == 1
    assert loops[0]["uuid"] == "uuid1"

@patch("src.data.ui_loaders.frontmatter.load", side_effect=Exception("test error"))
def test_load_promotable_loops_load_error(mock_load, temp_dirs):
    """Test the load_promotable_loops function when there is an error loading a file."""
    db_path, loops_dir, roadmap_dir = temp_dirs
    (loops_dir / "loop1.md").touch()
    loops = load_promotable_loops(db_path, loops_dir, roadmap_dir)
    assert len(loops) == 0

from src.data.ui_loaders import load_workstream_feedback_data, load_workstream_view_data


@patch("src.data.ui_loaders.sqlite3.connect")
def test_load_workstream_view_data(mock_connect, temp_dirs):
    """Test the load_workstream_view_data function."""
    db_path, loops_dir, _ = temp_dirs

    # Mock the database
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    mock_connect.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cur
    mock_cur.fetchall.return_value = [("ws1", "title1", "tag1", "goal1", "owner1")]

    # Create a dummy loop file
    (loops_dir / "loop1.md").write_text("---\nuuid: uuid1\nworkstream: ws1\n---\ncontent")

    db_path.touch() # Ensure the db path exists
    workstreams, loops = load_workstream_view_data(db_path, loops_dir)

    assert len(workstreams) == 1
    assert workstreams[0]["id"] == "ws1"
    assert len(loops) == 1
    assert loops[0]["uuid"] == "uuid1"

@patch("src.data.ui_loaders.pd.read_sql")
@patch("src.data.ui_loaders.sqlite3.connect")
def test_load_workstream_feedback_data(mock_connect, mock_read_sql, temp_dirs):
    """Test the load_workstream_feedback_data function."""
    db_path, _, _ = temp_dirs

    # Mock the database
    mock_connect.return_value = MagicMock()

    db_path.touch() # Ensure the db path exists
    load_workstream_feedback_data(db_path)

    assert mock_read_sql.call_count == 3
