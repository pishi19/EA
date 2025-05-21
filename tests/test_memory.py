import pytest
import sys
import os
import sqlite3
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from load_loops_for_prompt import get_recent_loops, format_loops_for_prompt

DB_PATH = "test_loop_memory.db"  # Use local file for portability

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    # Setup: create and populate a test loop memory db
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS loops")
    cursor.execute("""
        CREATE TABLE loops (
            id TEXT PRIMARY KEY,
            summary TEXT,
            created TEXT
        )
    """)
    now = datetime.now()
    sample_loops = [
        ("t1", "Test loop A", now.isoformat()),
        ("t2", "Test loop B", (now - timedelta(days=1)).isoformat()),
        ("t3", "Test loop C", (now - timedelta(days=2)).isoformat()),
    ]
    cursor.executemany("INSERT INTO loops (id, summary, created) VALUES (?, ?, ?)", sample_loops)
    conn.commit()
    conn.close()
    yield
    os.remove(DB_PATH)  # teardown

def test_get_recent_loops_returns_expected_count():
    loops = get_recent_loops(limit=2)
    assert len(loops) == 2

def test_format_loops_for_prompt_output_structure():
    loops = ["One", "Two"]
    result = format_loops_for_prompt(loops)
    assert result == "- One\n- Two"
