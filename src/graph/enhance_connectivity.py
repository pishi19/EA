import sqlite3
from pathlib import Path

# Configuration
BASE_DIR = Path(__file__).parent
GRAPH_DB = BASE_DIR / "dependency_graph.db"


# Function to enhance connectivity for isolated nodes
def enhance_connectivity():
    with sqlite3.connect(GRAPH_DB) as conn:
        c = conn.cursor()
        # Query to find isolated nodes
        c.execute(
            "SELECT id FROM nodes WHERE id NOT IN (SELECT from_id FROM edges) AND id NOT IN (SELECT to_id FROM edges)"
        )
        isolated_nodes = c.fetchall()

        # Example: Connect isolated nodes to a central node (e.g., a project or loop)
        central_node = (
            "02 Workstreams/Projects/project-2025-05-21-summary:-trial-users-are-exper.md"
        )
        for node in isolated_nodes:
            c.execute(
                "INSERT INTO edges (from_id, to_id, reason) VALUES (?, ?, ?)",
                (node[0], central_node, "enhanced_connectivity"),
            )

        conn.commit()
        print(f"Enhanced connectivity for {len(isolated_nodes)} isolated nodes.")


if __name__ == "__main__":
    enhance_connectivity()
