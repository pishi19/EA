import os
import sqlite3
from pathlib import Path
import frontmatter

# Configuration
BASE_DIR = Path(__file__).parent
GRAPH_DB = BASE_DIR / "dependency_graph.db"
VAULT_PATH = Path("/Users/air/AIR01")

# Initialization
def init_db():
    with sqlite3.connect(GRAPH_DB) as conn:
        c = conn.cursor()
        c.execute("CREATE TABLE IF NOT EXISTS nodes (id TEXT PRIMARY KEY, type TEXT)")
        c.execute("CREATE TABLE IF NOT EXISTS edges (from_id TEXT, to_id TEXT, reason TEXT)")
        conn.commit()

# Utility
def add_node(conn, node_id, node_type):
    conn.execute("INSERT OR IGNORE INTO nodes (id, type) VALUES (?, ?)", (node_id, node_type))

def add_edge(conn, from_id, to_id, reason):
    conn.execute("INSERT INTO edges (from_id, to_id, reason) VALUES (?, ?, ?)", (from_id, to_id, reason))

# Parse markdown notes
def scan_md_files():
    all_files = list(VAULT_PATH.rglob("*.md"))
    with sqlite3.connect(GRAPH_DB) as conn:
        for file_path in all_files:
            relative_id = str(file_path.relative_to(VAULT_PATH))
            add_node(conn, relative_id, "file")

            try:
                post = frontmatter.load(file_path)
                fm = post.metadata

                # Link to loop
                if "loop" in fm:
                    loop_id = fm["loop"]
                    add_node(conn, loop_id, "loop")
                    add_edge(conn, relative_id, loop_id, "linked_loop")

                # Link to project
                if "project" in fm:
                    project_id = fm["project"]
                    add_node(conn, project_id, "project")
                    add_edge(conn, relative_id, project_id, "linked_project")

                # Link to person
                if "person" in fm:
                    person_id = fm["person"]
                    add_node(conn, person_id, "person")
                    add_edge(conn, relative_id, person_id, "linked_person")

                # Link to goal
                if "goal" in fm:
                    goal = fm["goal"]
                    goal_id = f"goal:{goal[:64]}"
                    add_node(conn, goal_id, "goal")
                    add_edge(conn, relative_id, goal_id, "linked_goal")

            except Exception as e:
                print(f"⚠️ Failed to parse {file_path}: {e}")
        conn.commit()

if __name__ == "__main__":
    print("🧠 Building dependency graph...")
    init_db()
    scan_md_files()
    print(f"✅ Graph updated: {GRAPH_DB}") 