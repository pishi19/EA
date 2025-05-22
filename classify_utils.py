
from openai import OpenAI
from qdrant_client import QdrantClient

client = OpenAI()
qdrant = QdrantClient("localhost", port=6333)
COLLECTION = "workstream_items"

def embed_text(text):
    response = client.embeddings.create(
        input=[text],
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def classify_task_semantically(task, top_k=3):
    vector = embed_text(task)
    results = qdrant.search(
        collection_name=COLLECTION,
        query_vector=vector,
        limit=top_k,
        with_payload=True
    )
    matches = []
    for res in results:
        payload = res.payload
        matches.append({
            "file": payload.get("path", ""),
            "type": payload.get("type", "unknown"),
            "similarity": round(res.score, 3)
        })
    return matches
