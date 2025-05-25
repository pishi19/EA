import sqlite3
from collections import Counter
from pathlib import Path

import matplotlib.pyplot as plt
import networkx as nx

GRAPH_DB = Path(__file__).parent / "dependency_graph.db"
DASHBOARD_MD = Path("/Users/air/AIR01/System/Dashboards/dependency_graph.md")


def summarize_graph():
    with sqlite3.connect(GRAPH_DB) as conn:
        c = conn.cursor()

        # Count total nodes and edges
        c.execute("SELECT COUNT(*) FROM nodes")
        total_nodes = c.fetchone()[0]

        c.execute("SELECT COUNT(*) FROM edges")
        total_edges = c.fetchone()[0]

        # Count out-degree (edges from each node)
        c.execute("SELECT from_id FROM edges")
        from_counts = Counter(row[0] for row in c.fetchall())

        # Count in-degree (edges to each node)
        c.execute("SELECT to_id FROM edges")
        to_counts = Counter(row[0] for row in c.fetchall())

    # Filter out placeholder nodes
    PLACEHOLDER_NODES = {"goal:Add your goal here"}

    filtered_to_counts = {k: v for k, v in to_counts.items() if k not in PLACEHOLDER_NODES}
    filtered_from_counts = {k: v for k, v in from_counts.items() if k not in PLACEHOLDER_NODES}

    # Console Output
    print("📊 Dependency Graph Summary")
    print(f"- Total Nodes: {total_nodes}")
    print(f"- Total Edges: {total_edges}\n")

    print("⬆️ Top 10 Referenced Nodes (in-degree):")
    for node, count in sorted(filtered_to_counts.items(), key=lambda x: -x[1])[:10]:
        print(f"{count:3} ← {node}")

    print("\n⬇️ Top 10 Referencing Nodes (out-degree):")
    for node, count in sorted(filtered_from_counts.items(), key=lambda x: -x[1])[:10]:
        print(f"{count:3} → {node}")

    # Markdown Output
    with open(DASHBOARD_MD, "w") as f:
        f.write("# 🔗 Dependency Graph Dashboard\n\n")
        f.write(
            "This dashboard summarizes semantic and file-level dependencies in the EA system.\n\n"
        )
        f.write("## 📊 Summary\n\n")
        f.write(f"- Total Nodes: {total_nodes}\n")
        f.write(f"- Total Edges: {total_edges}\n\n")

        f.write("## ⬆️ Top 10 Referenced Nodes (in-degree):\n")
        for node, count in sorted(filtered_to_counts.items(), key=lambda x: -x[1])[:10]:
            f.write(f"- {count} ← `{node}`\n")
        f.write("\n## ⬇️ Top 10 Referencing Nodes (out-degree):\n")
        for node, count in sorted(filtered_from_counts.items(), key=lambda x: -x[1])[:10]:
            f.write(f"- {count} → `{node}`\n")
        f.write("\n_Last updated by `summarize_dependency_graph.py`_\n")


def explore_isolated_nodes():
    with sqlite3.connect(GRAPH_DB) as conn:
        c = conn.cursor()
        c.execute(
            """
            SELECT n.id, n.type
            FROM nodes n
            LEFT JOIN edges e1 ON n.id = e1.from_id
            LEFT JOIN edges e2 ON n.id = e2.to_id
            WHERE e1.from_id IS NULL AND e2.to_id IS NULL
        """
        )
        isolated_nodes = c.fetchall()

    print("\n🔍 Isolated Nodes (no edges):")
    for node_id, node_type in isolated_nodes:
        print(f"- {node_id} (Type: {node_type})")


def visualize_graph():
    G = nx.DiGraph()
    with sqlite3.connect(GRAPH_DB) as conn:
        c = conn.cursor()
        c.execute("SELECT from_id, to_id FROM edges")
        edges = c.fetchall()
        for from_id, to_id in edges:
            G.add_edge(from_id, to_id)

    plt.figure(figsize=(12, 8))
    pos = nx.spring_layout(G)
    nx.draw(
        G,
        pos,
        with_labels=True,
        node_color="lightblue",
        node_size=500,
        font_size=8,
        font_weight="bold",
        arrows=True,
    )
    plt.title("Dependency Graph Visualization")
    plt.savefig("dependency_graph.png")
    plt.close()


if __name__ == "__main__":
    summarize_graph()
    explore_isolated_nodes()
    visualize_graph()
