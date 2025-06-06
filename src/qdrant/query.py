import os
from typing import Any, Dict, List  # Added for type hinting

import qdrant_client
from dotenv import load_dotenv
from openai import OpenAI  # Import the main OpenAI class
from qdrant_client.http import models

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI API key
# Ensure OPENAI_API_KEY is set in your environment or .env file
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("Warning: OPENAI_API_KEY not found. Embedding will fail.")
    # openai.api_key will not be set globally in v1.x, client uses key directly

# Initialize OpenAI Client (v1.x API)
# The API key is typically passed to the constructor or set as an env var OPENAI_API_KEY
client = OpenAI()

# Default QDRANT_HOST is now the remote IP, QDRANT_PORT remains configurable
QDRANT_REMOTE_HOST = "170.64.176.146"
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
# QDRANT_GRPC_PORT = int(os.getenv("QDRANT_GRPC_PORT", 6334))

# Initialize qclient as None globally
qclient = None

def get_qdrant_client():
    """Initializes and returns a Qdrant client, or None if connection fails."""
    global qclient
    if qclient is None:
        try:
            # Use the remote host IP
            # QDRANT_HOST environment variable can override this if set, else defaults to QDRANT_REMOTE_HOST
            effective_host = os.getenv("QDRANT_HOST", QDRANT_REMOTE_HOST)
            qdrant_url = f"http://{effective_host}:{QDRANT_PORT}"
            print(f"Attempting to initialize Qdrant client with explicit URL: {qdrant_url}")
            temp_qclient = qdrant_client.QdrantClient(url=qdrant_url, timeout=10) # Added timeout
            temp_qclient.get_collections() # Test connection
            print(f"Qdrant client successfully initialized with URL: {qdrant_url}")
            qclient = temp_qclient
        except Exception as e:
            print(f"Error initializing Qdrant client with URL {qdrant_url}: {e}")
            qclient = None
    return qclient

def embed_text(text: str) -> List[float]:
    """Generates embeddings for the given text using OpenAI v1.x API."""
    if not OPENAI_API_KEY: # Check if key was loaded, as client init might not fail silently
        raise ValueError("OpenAI API key is not set. Cannot generate embeddings.")
    try:
        response = client.embeddings.create(
            input=text,
            model="text-embedding-ada-002"
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error calling OpenAI Embedding API: {e}")
        raise

def find_nearest_project_match(text: str, collection_name: str = "workstream_items") -> Dict[str, Any]:
    """Finds the nearest project match in Qdrant for the given text embedding."""
    current_qclient = get_qdrant_client()
    if not current_qclient:
        print("Qdrant client not available. Returning empty match.")
        return {"project": None, "phase": None, "score": 0.0, "error": "Qdrant client not available"}

    try:
        embedding = embed_text(text)
    except Exception as e:
        print(f"Failed to generate embedding for text: '{text[:100]}...'")
        return {"project": None, "phase": None, "score": 0.0, "error": str(e)}

    try:
        hits = current_qclient.search(
            collection_name=collection_name,
            query_vector=embedding,
            limit=1,
            search_params=models.SearchParams(hnsw_ef=64)
        )
    except Exception as e:
        print(f"Error searching Qdrant collection '{collection_name}': {e}")
        return {"project": None, "phase": None, "score": 0.0, "error": f"Qdrant search error: {e}"}

    if not hits:
        return {"project": None, "phase": None, "score": 0.0}

    payload = hits[0].payload or {}
    return {
        "project": payload.get("project"),
        "phase": payload.get("phase"),
        "score": round(hits[0].score, 3)
    }

# Example usage (optional, for testing this module directly)
if __name__ == "__main__":
    if not OPENAI_API_KEY:
        print("OPENAI_API_KEY is not set in the environment. Skipping Qdrant query example.")
    else:
        print("Attempting to get Qdrant client for __main__ test...")
        # __main__ will now also attempt to connect to the configured QDRANT_HOST (remote by default)
        test_qclient = get_qdrant_client()
        if not test_qclient:
            print("Qdrant client could not be initialized for __main__ test. Skipping Qdrant query example.")
        else:
            print("Testing Qdrant query module with OpenAI v1.x API...")
            # Ensure the collection "workstream_items" exists and has data for this test to be meaningful.
            # Example: First, you might need to create and populate the collection.
            # try:
            #     qclient.recreate_collection(
            #         collection_name="workstream_items",
            #         vectors_config=models.VectorParams(size=1536, distance=models.Distance.COSINE)
            #     )
            #     print("'workstream_items' collection ensured.")
            #     # Add some dummy data
            #     qclient.upsert(
            #         collection_name="workstream_items",
            #         points=[
            #             models.PointStruct(
            #                 id=1,
            #                 vector=embed_text("Initial Ora project setup and planning"),
            #                 payload={"project": "Ora Executive Assistant", "phase": "1.0"}
            #             ),
            #             models.PointStruct(
            #                 id=2,
            #                 vector=embed_text("Data migration for CRM system"),
            #                 payload={"project": "CRM Update", "phase": "2.3"}
            #             ),
            #         ]\n        #     )
            #     print("Dummy data added to 'workstream_items'.")
            # except Exception as e:
            #     print(f"Could not ensure/populate collection for test: {e}")

            test_text_1 = "Need to finalize the executive summary for the Ora assistant project, phase one."
            print(f"\nFinding match for: '{test_text_1}'")
            match_1 = find_nearest_project_match(test_text_1)
            print(f"Result: {match_1}")

            test_text_2 = "There is an issue with the customer database migration scripts."
            print(f"\nFinding match for: '{test_text_2}'")
            match_2 = find_nearest_project_match(test_text_2)
            print(f"Result: {match_2}")

            test_text_no_match = "Looking for information about holiday schedules."
            print(f"\nFinding match for: '{test_text_no_match}'")
            match_no_match = find_nearest_project_match(test_text_no_match)
            print(f"Result (expected low score or no match): {match_no_match}")
