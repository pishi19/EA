import argparse
import sqlite3
from pathlib import Path

GRAPH_DB = Path(__file__).parent / "dependency_graph.db"


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
    main()
