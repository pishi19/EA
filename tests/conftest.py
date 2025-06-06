import shutil
import sqlite3
from pathlib import Path

import frontmatter
import pytest


@pytest.fixture(scope="session")
def test_env():
    """
    Creates a complete, isolated test environment with a temporary database
    and runtime files.
    """
    # 1. Create a temporary test directory
    test_dir = Path("tests/temp_test_env")
    test_dir.mkdir(exist_ok=True)

    runtime_dir = test_dir / "runtime"
    runtime_dir.mkdir(exist_ok=True)
    db_path = runtime_dir / "db" / "ora_test.db"
    (runtime_dir / "db").mkdir(exist_ok=True)
    loops_dir = runtime_dir / "loops"
    loops_dir.mkdir(exist_ok=True)
    roadmap_dir = runtime_dir / "roadmap"
    roadmap_dir.mkdir(exist_ok=True)

    # 2. Setup the database
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    # Create schema from the main schema file using an absolute path
    main_schema_path = Path(__file__).resolve().parent.parent / "runtime/db/schema.sql"
    with open(main_schema_path) as f:
        cur.executescript(f.read())

    # 3. Populate with data
    # Workstreams
    cur.execute("INSERT INTO workstreams (id, title, goals, owners) VALUES (?, ?, ?, ?)",
                ("ws_1", "Workstream One", "Goal A, Goal B", "owner1,owner2"))
    cur.execute("INSERT INTO workstreams (id, title, goals, owners) VALUES (?, ?, ?, ?)",
                ("ws_2", "Workstream Two", "Goal C", "owner3"))
    cur.execute("INSERT INTO workstreams (id, title, goals, owners) VALUES (?, ?, ?, ?)",
                ("ws_3_empty", "Workstream Three", "", ""))
    cur.execute("INSERT INTO workstreams (id, title, goals, owners) VALUES (?, ?, ?, ?)",
                ("ws_4_no_feedback", "Workstream Four", "Goal D", "owner4"))
    cur.execute("INSERT INTO workstreams (id, title, goals, owners) VALUES (?, ?, ?, ?)",
                ("ws_5_single_loop", "Workstream Five", "Goal E", "owner5"))

    # Loops
    cur.execute("INSERT INTO loop_metadata (uuid, title, workstream, status, score) VALUES ('loop_1_ws_1', 'Loop 1 in WS1', 'ws_1', 'active', 0.8)")
    cur.execute("INSERT INTO loop_metadata (uuid, title, workstream, status, score) VALUES ('loop_2_ws_1', 'Loop 2 in WS1', 'ws_1', 'active', 0.5)")
    cur.execute("INSERT INTO loop_metadata (uuid, title, workstream, status, score) VALUES ('loop_3_ws_2', 'Loop 3 in WS2', 'ws_2', 'active', 0.9)")
    cur.execute("INSERT INTO loop_metadata (uuid, title, workstream, status, score) VALUES ('loop_4_ws_2', 'Loop 4 in WS2', 'ws_2', 'pending', 0.2)")
    cur.execute("INSERT INTO loop_metadata (uuid, title, workstream, status, score) VALUES ('loop_5_ws_4', 'Loop 5 in WS4', 'ws_4_no_feedback', 'active', 0.9)")
    cur.execute("INSERT INTO loop_metadata (uuid, title, workstream, status, score) VALUES ('loop_6_ws_5', 'Loop 6 in WS5', 'ws_5_single_loop', 'active', 0.9)")

    # Feedback
    cur.execute("INSERT INTO loop_feedback (uuid, tag) VALUES ('loop_1_ws_1', 'useful')")
    cur.execute("INSERT INTO loop_feedback (uuid, tag) VALUES ('loop_1_ws_1', 'useful')")
    cur.execute("INSERT INTO loop_feedback (uuid, tag) VALUES ('loop_2_ws_1', 'false_positive')")
    cur.execute("INSERT INTO loop_feedback (uuid, tag) VALUES ('loop_6_ws_5', 'useful')")
    conn.commit()
    conn.close()

    # 4. Create corresponding .md files
    loop1_post = frontmatter.Post(content="Content for loop 1", uuid="loop_1_ws_1", workstream="ws_1", title="Loop 1 in WS1")
    with open(loops_dir / "loop1.md", "wb") as f:
        frontmatter.dump(loop1_post, f)

    loop2_post = frontmatter.Post(content="Content for loop 2", uuid="loop_2_ws_1", workstream="ws_1", title="Loop 2 in WS1")
    with open(loops_dir / "loop2.md", "wb") as f:
        frontmatter.dump(loop2_post, f)

    # Yield the paths to the test functions
    yield {
        "project_root": test_dir,
        "db_path": db_path,
        "loops_dir": loops_dir,
        "roadmap_dir": roadmap_dir
    }

    # 5. Teardown: clean up the temporary directory
    shutil.rmtree(test_dir)
