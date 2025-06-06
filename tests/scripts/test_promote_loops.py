import sqlite3
from unittest.mock import patch

import frontmatter
import pytest

from scripts.promote_loops import find_promotable_loops, main


@pytest.fixture
def temp_runtime(tmp_path):
    """Create a temporary runtime directory structure for testing."""
    runtime_dir = tmp_path / "runtime"
    loops_dir = runtime_dir / "loops"
    roadmap_dir = runtime_dir / "roadmap"
    db_dir = runtime_dir / "db"

    loops_dir.mkdir(parents=True, exist_ok=True)
    roadmap_dir.mkdir(parents=True, exist_ok=True)
    db_dir.mkdir(parents=True, exist_ok=True)

    # Create dummy ora.db
    db_path = db_dir / "ora.db"
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE loop_metadata (
            uuid TEXT PRIMARY KEY,
            title TEXT,
            workstream TEXT
        )
    """)
    # Promotable loop: has file, in db, not in roadmap
    cur.execute("INSERT INTO loop_metadata VALUES ('uuid1', 'title1', 'workstream1')")
    # Promoted loop: has file, in db, in roadmap
    cur.execute("INSERT INTO loop_metadata VALUES ('uuid2', 'title2', 'workstream2')")
    # Loop without file
    cur.execute("INSERT INTO loop_metadata VALUES ('uuid3', 'title3', 'workstream3')")
    conn.commit()
    conn.close()

    # Create dummy loop files
    post1 = frontmatter.Post(content="content1", uuid="uuid1", title="title1")
    with open(loops_dir / "loop1.md", "wb") as f:
        frontmatter.dump(post1, f)

    post2 = frontmatter.Post(content="content2", uuid="uuid2", title="title2")
    with open(loops_dir / "loop2.md", "wb") as f:
        frontmatter.dump(post2, f)

    # Create dummy roadmap file
    roadmap_post = frontmatter.Post(content="roadmap_content", origin_loop="uuid2")
    with open(roadmap_dir / "roadmap1.md", "wb") as f:
        frontmatter.dump(roadmap_post, f)

    return tmp_path

def test_find_promotable_loops(temp_runtime):
    """Test the find_promotable_loops function."""

    runtime_dir = temp_runtime / "runtime"
    roadmap_dir = runtime_dir / "roadmap"
    db_path = runtime_dir / "db" / "ora.db"
    loops_dir = runtime_dir / "loops"

    promotable = find_promotable_loops(
        roadmap_dir=roadmap_dir,
        db_path=db_path,
        loops_dir=loops_dir
    )

    assert len(promotable) == 1
    assert promotable[0]["uuid"] == "uuid1"
    assert promotable[0]["title"] == "title1"
    assert promotable[0]["workstream"] == "workstream1"

def test_main_no_promotable_loops(capsys, monkeypatch):
    """Test main function when there are no promotable loops."""
    monkeypatch.setattr("scripts.promote_loops.find_promotable_loops", lambda: [])
    main()
    captured = capsys.readouterr()
    assert "✅ No promotable loops found." in captured.out

@patch('builtins.input', side_effect=['1', 'q'])
def test_main_with_promotable_loops_and_promote(mock_input, capsys, temp_runtime, monkeypatch):
    """Test main function with promotable loops and promoting one."""

    # Since main calls find_promotable_loops without args, we need to patch it
    # to return the loops from our test setup.
    promotable_loops = [{
        "uuid": "uuid1", "title": "title1", "workstream": "workstream1"
    }]
    monkeypatch.setattr("scripts.promote_loops.find_promotable_loops", lambda: promotable_loops)

    # We also need to patch promote_loop_to_roadmap to not actually create files
    # during the test, and return a success message.
    monkeypatch.setattr(
        "scripts.promote_loops.promote_loop_to_roadmap",
        lambda uuid: {"status": "success", "file_path": "/fake/path"}
    )

    main()

    captured = capsys.readouterr()
    assert "The following loops are ready for promotion:" in captured.out
    assert "[1] title1 (Workstream: workstream1)" in captured.out
    assert "🚀 Promoting 'title1'..." in captured.out
    assert "✅ Success! Created roadmap file:" in captured.out

@patch('builtins.input', side_effect=['q'])
def test_main_quit(mock_input, capsys, temp_runtime, monkeypatch):
    """Test quitting the main loop."""
    promotable_loops = [{
        "uuid": "uuid1", "title": "title1", "workstream": "workstream1"
    }]
    monkeypatch.setattr("scripts.promote_loops.find_promotable_loops", lambda: promotable_loops)
    main()
    captured = capsys.readouterr()
    assert "Exiting promotion tool." in captured.out
