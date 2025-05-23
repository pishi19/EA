# /Users/air/ea_assistant/query_dependency_graph.py

import argparse
import sqlite3
from pathlib import Path

import frontmatter

# Configuration
BASE_DIR = Path(__file__).parent.parent  # Go up one level to project root
GRAPH_DB = BASE_DIR / "data" / "dependency_graph.db"
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

def fix_frontmatter(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    # Check if frontmatter exists
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            frontmatter_text = parts[1].strip()
            # Fix common errors
            # 1. Fix missing commas in lists
            frontmatter_text = frontmatter_text.replace(']\n[', '],\n[')
            # 2. Fix unhashable keys (e.g., keys with spaces or special chars)
            lines = frontmatter_text.split('\n')
            fixed_lines = []
            for line in lines:
                if ':' in line:
                    key, value = line.split(':', 1)
                    if ' ' in key.strip():
                        fixed_lines.append(f'"{key.strip()}":{value}')
                    else:
                        fixed_lines.append(line)
                else:
                    fixed_lines.append(line)
            fixed_frontmatter = '\n'.join(fixed_lines)
            # Reconstruct the file content
            fixed_content = '---\n' + fixed_frontmatter + '\n---' + parts[2]
            with open(file_path, 'w') as f:
                f.write(fixed_content)
            return True
    return False

def validate_frontmatter(file_path):
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                frontmatter_text = parts[1].strip()
                # Validate YAML
                import yaml
                yaml.safe_load(frontmatter_text)
                return True
    except Exception as e:
        print(f"⚠️ Validation failed for {file_path}: {e}")
    return False

def scan_md_files():
    all_files = list(VAULT_PATH.rglob("*.md"))
    skipped_files = []
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
                # Attempt to fix the frontmatter
                if fix_frontmatter(file_path):
                    try:
                        post = frontmatter.load(file_path)
                        fm = post.metadata
                        # Re-process the file after fixing
                        if "loop" in fm:
                            loop_id = fm["loop"]
                            add_node(conn, loop_id, "loop")
                            add_edge(conn, relative_id, loop_id, "linked_loop")
                        if "project" in fm:
                            project_id = fm["project"]
                            add_node(conn, project_id, "project")
                            add_edge(conn, relative_id, project_id, "linked_project")
                        if "person" in fm:
                            person_id = fm["person"]
                            add_node(conn, person_id, "person")
                            add_edge(conn, relative_id, person_id, "linked_person")
                        if "goal" in fm:
                            goal = fm["goal"]
                            goal_id = f"goal:{goal[:64]}"
                            add_node(conn, goal_id, "goal")
                            add_edge(conn, relative_id, goal_id, "linked_goal")
                    except Exception as e2:
                        print(f"⚠️ Failed to parse {file_path} even after fixing: {e2}")
                        skipped_files.append((file_path, str(e2)))
                else:
                    skipped_files.append((file_path, str(e)))
        conn.commit()

    if skipped_files:
        print("\nSkipped files due to parsing errors:")
        for file, err in skipped_files:
            print(f"  - {file} | {err}")
        # Write to markdown report
        with open("skipped_files_report.md", "w") as f:
            f.write("# Skipped Files Report\n\n")
            f.write("The following files could not be parsed due to frontmatter errors.\n\n")
            for file, err in skipped_files:
                f.write(f"- **{file}**\n    - Error: `{err}`\n")

def get_connections(node_id):
    with sqlite3.connect(GRAPH_DB) as conn:
        c = conn.cursor()
        c.execute("SELECT to_id, reason FROM edges WHERE from_id=?", (node_id,))
        downstream = c.fetchall()
        c.execute("SELECT from_id, reason FROM edges WHERE to_id=?", (node_id,))
        upstream = c.fetchall()
    return upstream, downstream

def main():
    parser = argparse.ArgumentParser(description="Query the dependency graph.")
    parser.add_argument("--node", required=True, help="Node ID to inspect")
    args = parser.parse_args()
    upstream, downstream = get_connections(args.node)
    
    print(f"🔍 Node: {args.node}")
    print("\n⬆️ Upstream dependencies:")
    for u in upstream:
        print(f"- {u[0]} ({u[1]})")

    print("\n⬇️ Downstream dependencies:")
    for d in downstream:
        print(f"- {d[0]} ({d[1]})")

if __name__ == "__main__":
    print("🧠 Building dependency graph...")
    init_db()
    scan_md_files()
    print(f"✅ Graph updated: {GRAPH_DB}")