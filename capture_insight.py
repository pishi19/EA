"""
capture_insight.py

Accepts natural language input and optional tags,
then routes it to the insight assistant pipeline.
"""

import argparse
from summarize_insight import summarize
from write_loop_file import write_loop_file
from insert_to_sqlite import insert_to_sqlite
from insert_to_qdrant import insert_to_qdrant
from update_insight_panel import update_insight_panel

def main():
    parser = argparse.ArgumentParser(description="Capture an insight")
    parser.add_argument("content", type=str, help="The insight content")
    parser.add_argument("--tags", nargs="*", help="Tags for classification", default=[])
    parser.add_argument("--source", type=str, default="manual", help="Source of insight")
    args = parser.parse_args()

    summary, metadata = summarize(args.content, args.tags)
    file_path, loop_id = write_loop_file(summary, metadata)
    insert_to_sqlite(loop_id, summary, metadata)
    insert_to_qdrant(loop_id, summary, metadata)
    update_insight_panel(loop_id, summary, metadata, file_path)

if __name__ == "__main__":
    main()
