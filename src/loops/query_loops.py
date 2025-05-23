"""
query_loops.py

Query Ora's loop memory and log results to /0001-HQ/Insights/loop_queries.md
"""

import argparse
import sqlite3
from datetime import datetime
from pathlib import Path

from openai import OpenAI
from qdrant_client import QdrantClient

client = OpenAI()
qdrant = QdrantClient(host="localhost", port=6333)
DB_PATH = "/Users/air/ea_assistant/loop_memory.db"
COLLECTION_NAME = "loop_embeddings"
LOG_PATH = Path("/Users/air/AIR01/0001-HQ/Insights/loop_queries.md")

def embed_query(text):
    response = client.embeddings.create(
        input=[text],
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def search_qdrant(embedding, top_k=5):
    results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=embedding,
        limit=top_k,
        with_payload=True
    )
    return results

def filter_sqlite(loop_ids, status_filter=None, min_weight=None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    placeholders = ",".join(["?"] * len(loop_ids))
    query = f"SELECT id, summary, status, priority, weight FROM loops WHERE id IN ({placeholders})"
    if status_filter:
        query += " AND status = ?"
        loop_ids.append(status_filter)
    if min_weight is not None:
        query += " AND weight >= ?"
        loop_ids.append(min_weight)
    cursor.execute(query, loop_ids)
    results = cursor.fetchall()
    conn.close()
    return results

def log_results(query_text, results):
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a") as log:
        log.write(f"\n\n## 🔍 Query: {query_text} ({datetime.now().isoformat(timespec='minutes')})\n")
        log.write("<details><summary>View Results</summary>\n\n")
        for row in results:
            log.write(f"- **{row[0]}**: {row[1][:80]}... *(status: {row[2]}, priority: {row[3]})*\n")
        log.write("</details>\n")

def main():
    parser = argparse.ArgumentParser(description="Query loop memory and log the results.")
    parser.add_argument("query", type=str, help="Natural language query")
    parser.add_argument("--status", type=str, help="Optional status filter: open/closed", default=None)
    parser.add_argument("--min_weight", type=int, help="Minimum weight threshold", default=None)
    args = parser.parse_args()

    print(f"🔍 Query: {args.query}")
    embedding = embed_query(args.query)
    qdrant_results = search_qdrant(embedding)
    loop_ids = [hit.payload.get("loop_id") for hit in qdrant_results if "loop_id" in hit.payload]
    sqlite_data = filter_sqlite(loop_ids, args.status, args.min_weight)

    print("\n🎯 Matched Loops:")
    for row in sqlite_data:
        print(f"- {row[0]} | {row[1][:80]}... | status: {row[2]} | priority: {row[3]} | weight: {row[4]}")

    log_results(args.query, sqlite_data)

if __name__ == "__main__":
    main()
