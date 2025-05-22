"""
insert_to_qdrant.py

Embeds the summary and inserts it into a live Qdrant instance using UUID point IDs.
"""

from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance
import uuid
import hashlib

client = OpenAI()
qdrant = QdrantClient(host="localhost", port=6333)

COLLECTION_NAME = "loop_embeddings"

def embed_text(text):
    response = client.embeddings.create(
        input=[text],
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def generate_uuid_from_string(value):
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, value))

def insert_to_qdrant(loop_id, summary, metadata):
    # Ensure collection exists
    qdrant.recreate_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
    )

    vector = embed_text(summary)
    point_id = generate_uuid_from_string(loop_id)

    qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "loop_id": loop_id,
                    "summary": summary,
                    "tags": metadata["tags"],
                    "status": metadata["status"],
                    "type": metadata["type"],
                    "priority": metadata["priority"],
                    "source": metadata["source"]
                }
            )
        ]
    )

    print(f"✅ Embedded and inserted loop {loop_id} (ID: {point_id}) into Qdrant collection '{COLLECTION_NAME}'")
