import sqlite3
from datetime import datetime
from pathlib import Path

import matplotlib.pyplot as plt
import networkx as nx
import pandas as pd


class GraphAnalyzer:
    def __init__(self, db_path: str = "System/Reference/dependency_graph.db"):
        self.db_path = Path(db_path)
        self.graph = nx.DiGraph()
        self._load_graph()

    def _load_graph(self):
        """Load the dependency graph from SQLite database"""
        with sqlite3.connect(self.db_path) as conn:
            # Load nodes
            nodes = pd.read_sql_query("SELECT * FROM nodes", conn)
            for _, row in nodes.iterrows():
                self.graph.add_node(row["id"], type=row["type"])

            # Load edges
            edges = pd.read_sql_query("SELECT * FROM edges", conn)
            for _, row in edges.iterrows():
                self.graph.add_edge(row["from_id"], row["to_id"], reason=row["reason"])

    def analyze_connectivity(self) -> dict:
        """Analyze graph connectivity metrics"""
        metrics = {
            "total_nodes": self.graph.number_of_nodes(),
            "total_edges": self.graph.number_of_edges(),
            "isolated_nodes": len(list(nx.isolates(self.graph))),
            "connected_components": nx.number_weakly_connected_components(self.graph),
            "density": nx.density(self.graph),
            "average_clustering": nx.average_clustering(self.graph.to_undirected()),
            "average_shortest_path": self._calculate_avg_shortest_path(),
            "central_nodes": self._identify_central_nodes(),
        }
        return metrics

    def _calculate_avg_shortest_path(self) -> float:
        """Calculate average shortest path length for connected components"""
        try:
            # Convert to undirected for path calculation
            undirected = self.graph.to_undirected()
            # Get largest connected component
            largest_cc = max(nx.connected_components(undirected), key=len)
            subgraph = undirected.subgraph(largest_cc)
            return nx.average_shortest_path_length(subgraph)
        except (nx.NetworkXError, nx.NetworkXNotImplemented, ValueError):
            return 0.0

    def _identify_central_nodes(self, top_n: int = 5) -> list[tuple[str, float]]:
        """Identify most central nodes using PageRank"""
        try:
            pagerank = nx.pagerank(self.graph)
            return sorted(pagerank.items(), key=lambda x: x[1], reverse=True)[:top_n]
        except (nx.NetworkXError, nx.NetworkXNotImplemented, ValueError):
            return []

    def generate_visualization(self, output_path: str = "System/Reference/graph_visualization.png"):
        """Generate a visualization of the dependency graph"""
        plt.figure(figsize=(15, 10))

        # Use spring layout for better visualization
        pos = nx.spring_layout(self.graph)

        # Draw nodes with different colors based on type
        node_colors = []
        for node in self.graph.nodes():
            node_type = self.graph.nodes[node]["type"]
            if node_type == "file":
                node_colors.append("lightblue")
            elif node_type == "loop":
                node_colors.append("lightgreen")
            elif node_type == "project":
                node_colors.append("lightcoral")
            else:
                node_colors.append("lightgray")

        # Draw the graph
        nx.draw_networkx_nodes(self.graph, pos, node_color=node_colors, node_size=500)
        nx.draw_networkx_edges(self.graph, pos, edge_color="gray", arrows=True)

        # Add labels
        labels = {node: node.split("/")[-1] for node in self.graph.nodes()}
        nx.draw_networkx_labels(self.graph, pos, labels, font_size=8)

        plt.title("Dependency Graph Visualization")
        plt.axis("off")
        plt.savefig(output_path, dpi=300, bbox_inches="tight")
        plt.close()

    def generate_report(self, output_path: str = "System/Reference/graph_analysis_report.md"):
        """Generate a detailed analysis report"""
        metrics = self.analyze_connectivity()

        report = [
            "# Dependency Graph Analysis Report",
            f"\nGenerated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
            "## Graph Metrics",
            f"- Total Nodes: {metrics['total_nodes']}",
            f"- Total Edges: {metrics['total_edges']}",
            f"- Isolated Nodes: {metrics['isolated_nodes']}",
            f"- Connected Components: {metrics['connected_components']}",
            f"- Graph Density: {metrics['density']:.4f}",
            f"- Average Clustering Coefficient: {metrics['average_clustering']:.4f}",
            f"- Average Shortest Path Length: {metrics['average_shortest_path']:.2f}\n",
            "## Central Nodes (PageRank)",
        ]

        for node, score in metrics["central_nodes"]:
            report.append(f"- {node}: {score:.4f}")

        report.append("\n## Node Type Distribution")
        node_types = {}
        for node in self.graph.nodes():
            node_type = self.graph.nodes[node]["type"]
            node_types[node_type] = node_types.get(node_type, 0) + 1

        for node_type, count in node_types.items():
            report.append(f"- {node_type}: {count}")

        # Save report
        with open(output_path, "w") as f:
            f.write("\n".join(report))


if __name__ == "__main__":
    analyzer = GraphAnalyzer()
    analyzer.generate_visualization()
    analyzer.generate_report()
