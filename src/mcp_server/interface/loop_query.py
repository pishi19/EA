import argparse
import os
import sys

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from mcp_server.loops.loop_memory import query_loops


def main():
    parser = argparse.ArgumentParser(description="Query loop memory")
    parser.add_argument("--status", help="Filter by loop status (e.g., open, closed)")
    parser.add_argument("--principle", help="Filter by associated principle")

    args = parser.parse_args()
    results = query_loops(status=args.status, principle=args.principle)

    if results:
        for loop in results:
            print(f"- ID: {loop.get('id')}")
            print(f"  Summary: {loop.get('summary')}")
            print(f"  Status: {loop.get('status')}")
            print(f"  Principles: {', '.join(loop.get('principles', []))}")
            print(f"  Source: {loop.get('source')}")
            print("")
    else:
        print("No matching loops found.")

if __name__ == "__main__":
    main()
