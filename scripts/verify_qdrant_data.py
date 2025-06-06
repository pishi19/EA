import sys  # Added for sys.exit

from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port=6333)
COLLECTION_NAME = "workstream_items"

try:
    # Check if collection exists first
    collections_response = client.get_collections()
    collection_names = [c.name for c in collections_response.collections]

    if COLLECTION_NAME not in collection_names:
        print(f"❌ Collection '{COLLECTION_NAME}' does not exist in Qdrant.")
        sys.exit(1)
    else:
        print(f"✅ Collection '{COLLECTION_NAME}' found.")

    # Fetch up to 10 points with their payloads
    points, _ = client.scroll(
        collection_name=COLLECTION_NAME,
        limit=10,
        with_payload=True,
        with_vectors=False # No need for vectors here
    )

    if not points:
        print(f"No points found in collection '{COLLECTION_NAME}'.")
    else:
        print(f"Found {len(points)} points:")
        for point in points:
            print("-" * 50)
            print("🧠 Point ID:", point.id)
            # Adjusted payload keys based on what update_qdrant_embeddings.py actually stores
            print("📄 File Stem (Original Loop ID if not in frontmatter):", point.payload.get("file_stem"))
            print("🏷️ Title:", point.payload.get("title"))
            print("📍 Path:", point.payload.get("path"))

except Exception as e:
    print(f"❌ An error occurred while trying to connect to Qdrant or fetch points: {e}")
    print("Please ensure Qdrant is running on localhost:6333 and the collection exists.")
    sys.exit(1)

sys.exit(0)
