"""
classify_structured_email_tasks.py

Classifies structured tasks from Signal_Tasks.md using Qdrant,
adds topic tags, links to matching loops or projects, and archives low-value items.
"""

import openai
from datetime import datetime
from qdrant_client import QdrantClient
from pathlib import Path

SIGNAL_FILE = Path("/Users/air/AIR01/0001-HQ/Signal_Tasks.md")
RETRO_DIR = Path("/Users/air/AIR01/Retrospectives")
COLLECTION_NAME = "loop_embeddings"

client = openai.OpenAI()
qdrant = QdrantClient(host="localhost", port=6333)

def embed(text):
    response = client.embeddings.create(input=[text], model="text-embedding-3-small")
    return response.data[0].embedding

def classify_task(text):
    vector = embed(text)
    results = qdrant.search(collection_name=COLLECTION_NAME, query_vector=vector, limit=3, with_payload=True)

    if not results:
        return [], None, 0.0

    top_tags = []
    top_loop = results[0].payload.get("loop_id") if "loop_id" in results[0].payload else None
    top_score = results[0].score

    for match in results:
        tags = match.payload.get("tags", [])
        top_tags.extend(tags)

    tag_counts = {}
    for tag in top_tags:
        tag_counts[tag] = tag_counts.get(tag, 0) + 1

    sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)
    tags = ["#" + tag for tag, _ in sorted_tags[:3]]
    return tags, top_loop, top_score

import argparse

def classify_and_route_tasks():
    trace_path = Path("/Users/air/AIR01/System/Logs/task_trace_log.md")
    trace_path.parent.mkdir(parents=True, exist_ok=True)
    if not trace_path.exists():
        with trace_path.open("w") as log:
            log.write("# 📌 Task Routing Trace Log\n\n")
    parser = argparse.ArgumentParser()
    parser.add_argument("--min_confidence", type=float, default=0.75)
    args = parser.parse_args()
    lines = SIGNAL_FILE.read_text().splitlines()
    min_conf = args.min_confidence
    updated_lines = []
    archived_lines = []

    for line in lines:
        if line.strip().startswith("- [ ]") and "#classified" not in line:
            if "#ignore" in line:
                continue
            content = line.split("Follow up on:")[-1].strip()
            tags, loop_id, score = classify_task(content)

            if score < min_conf and "#force-route" not in line:
                archived_lines.append(line + " #low_confidence #archived")
                continue

            routed = line + " " + " ".join(tags) + " #classified #routed"
            if loop_id:
                routed += " → [[" + loop_id + "]]"
                loop_file = RETRO_DIR / (loop_id + ".md")
                if loop_file.exists():
                    related_task_block = "\n\n---\n\n🔗 Related Task:\n- " + content + "  \n(from Signal_Tasks.md)\n"
                    loop_file.write_text(loop_file.read_text().strip() + related_task_block)
                    trace_path = Path("/Users/air/AIR01/System/Logs/task_trace_log.md")
                    trace_path.parent.mkdir(parents=True, exist_ok=True)
                    with trace_path.open("a") as log:
                        log.write(datetime.now().isoformat(timespec="seconds") + " — Routed task: \"" + content + "\" → " + loop_id + "\n")

            updated_lines.append(routed)
        else:
            updated_lines.append(line)

    if archived_lines:
        updated_lines.append("\n<details><summary>🗃️ Archived (Low Relevance)</summary>\n")
        updated_lines.extend(archived_lines)
        updated_lines.append("</details>\n")

    SIGNAL_FILE.write_text("\n".join(updated_lines))
    print("✅ Classified, routed, and archived email tasks.")

if __name__ == "__main__":
    classify_and_route_tasks()
