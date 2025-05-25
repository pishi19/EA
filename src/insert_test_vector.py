from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

client = QdrantClient(host="localhost", port=6333)

client.recreate_collection(
    collection_name="test_collection",
    vectors_config=VectorParams(size=4, distance=Distance.COSINE),
)

client.upsert(
    collection_name="test_collection",
    points=[
        PointStruct(id=1, vector=[0.1, 0.2, 0.3, 0.4]),
    ],
)

print("✅ Test vector inserted.")
