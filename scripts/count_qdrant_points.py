from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port=6333)

count = client.count(
    collection_name="workstream_items",
    exact=True
).count

print(f"📊 Total Points in Qdrant: {count}")
