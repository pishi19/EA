
from datetime import datetime
from pathlib import Path

from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct

client = OpenAI()
qdrant = QdrantClient("localhost", port=6333)
COLLECTION = "workstream_items"
TRACK_FILE = "/Users/air/ea_assistant/.last_embed_sync"

def embed(text):
    response = client.embeddings.create(input=[text], model="text-embedding-3-small")
    return response.data[0].embedding

def get_last_sync():
    if not Path(TRACK_FILE).exists():
        return datetime.min
    timestamp = Path(TRACK_FILE).read_text().strip()
    return datetime.fromisoformat(timestamp)

def update_last_sync():
    Path(TRACK_FILE).write_text(datetime.now().isoformat())

def resync_embeddings():
    last_sync = get_last_sync()
    files = list(Path("/Users/air/AIR01/02 Workstreams/Programs").glob("*.md")) +             list(Path("/Users/air/AIR01/02 Workstreams/Projects").glob("*.md"))

    for file in files:
        if datetime.fromtimestamp(file.stat().st_mtime) > last_sync:
            content = file.read_text()
            vector = embed(content)
            qdrant.upsert(
                collection_name=COLLECTION,
                points=[PointStruct(id=file.stem, vector=vector, payload={"path": str(file)})]
            )
            print(f"✅ Re-embedded: {file.name}")

    update_last_sync()
    print("✅ Sync complete.")

if __name__ == "__main__":
    resync_embeddings()
