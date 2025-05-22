
import os
from pathlib import Path
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid

client = OpenAI()
qdrant = QdrantClient("localhost", port=6333)
COLLECTION = "workstream_items"

def embed_text(text):
    response = client.embeddings.create(
        input=[text],
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def ensure_collection():
    collections = qdrant.get_collections().collections
    if not any(c.name == COLLECTION for c in collections):
        qdrant.recreate_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
        )
        print(f"✅ Created Qdrant collection: {COLLECTION}")

def process_directory(path, type_):
    md_files = list(Path(path).glob("*.md"))
    for file in md_files:
        text = file.read_text(encoding="utf-8")
        vector = embed_text(text)
        qdrant.upsert(
            collection_name=COLLECTION,
            points=[
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload={
                        "path": str(file),
                        "type": type_,
                        "name": file.stem
                    }
                )
            ]
        )
        print(f"✅ Embedded: {file.name} as {type_}")

def main():
    ensure_collection()
    process_directory("/Users/air/AIR01/02 Workstreams/Programs", "program")
    process_directory("/Users/air/AIR01/02 Workstreams/Projects", "project")
    print("✅ All files embedded into Qdrant.")

if __name__ == "__main__":
    main()
