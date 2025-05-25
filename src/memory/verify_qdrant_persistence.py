import uuid

import requests

URL = "http://localhost:6333"
COLLECTION = "test_vectors"

# 1. Create collection
create = requests.put(
    f"{URL}/collections/{COLLECTION}",
    json={"vectors": {"size": 4, "distance": "Cosine"}},
)
print("✅ Created collection:", create.json())

# 2. Insert a test vector
vector = [0.1, 0.2, 0.3, 0.4]
point_id = str(uuid.uuid4())

insert = requests.put(
    f"{URL}/collections/{COLLECTION}/points",
    json={"points": [{"id": point_id, "vector": vector, "payload": {"test": "ping"}}]},
)
print("✅ Inserted vector:", insert.json())

# 3. Search
search = requests.post(
    f"{URL}/collections/{COLLECTION}/points/search", json={"vector": vector, "top": 1}
)
print("🔍 Search result:", search.json())
