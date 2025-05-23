
from qdrant_client import QdrantClient
from qdrant_client.models import FieldCondition, Filter, MatchValue

qdrant = QdrantClient("localhost", port=6333)
COLLECTION = "workstream_items"

def purge_workstream_vectors():
    print("🚨 Deleting all program/project vectors from Qdrant collection...")
    qdrant.delete(
        collection_name=COLLECTION,
        points_selector=Filter(
            must=[
                FieldCondition(key="type", match=MatchValue(value="program")),
            ]
        )
    )
    qdrant.delete(
        collection_name=COLLECTION,
        points_selector=Filter(
            must=[
                FieldCondition(key="type", match=MatchValue(value="project")),
            ]
        )
    )
    print("✅ Purge complete.")

if __name__ == "__main__":
    purge_workstream_vectors()
