import argparse
from datetime import datetime
from pathlib import Path
import frontmatter
import hashlib
import uuid # Added for UUID generation

from openai import OpenAI
from qdrant_client import QdrantClient, models
from qdrant_client.http.exceptions import UnexpectedResponse as QdrantUnexpectedResponse
from qdrant_client.models import PointStruct, VectorParams, Distance
# Assuming EMBED_TRACK_FILE is not strictly needed for single file updates,
# but will keep it if resync logic is maintained.
# from src.path_config import EMBED_TRACK_FILE # Commented out for now, revise if resync needed

client = OpenAI()
# Ensure QDRANT_HOST and QDRANT_PORT are configured, e.g., via environment variables or a config file
QDRANT_HOST = "170.64.176.146" # Updated to Droplet IP
QDRANT_PORT = 6333      # Or get from env
QDRANT_COLLECTION_NAME = "workstream_items"
TEXT_EMBEDDING_MODEL_DIMENSION = 1536 # For text-embedding-3-small

# Initialize Qdrant Client and ensure collection exists
def get_qdrant_client_and_ensure_collection():
    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    try:
        collections = client.get_collections().collections
        collection_names = [c.name for c in collections]
        if QDRANT_COLLECTION_NAME not in collection_names:
            print(f"Collection '{QDRANT_COLLECTION_NAME}' not found. Creating it...")
            client.create_collection(
                collection_name=QDRANT_COLLECTION_NAME,
                vectors_config=VectorParams(size=TEXT_EMBEDDING_MODEL_DIMENSION, distance=Distance.COSINE)
            )
            print(f"Collection '{QDRANT_COLLECTION_NAME}' created successfully.")
        else:
            print(f"Collection '{QDRANT_COLLECTION_NAME}' already exists.")
    except Exception as e:
        print(f"Error connecting to Qdrant or ensuring collection: {e}")
        print("Please ensure Qdrant is running and accessible, and the API key for OpenAI is set if needed by other parts.")
        # Decide if script should exit or try to continue if collection status is uncertain
        # For now, let's allow it to try to continue, operations will fail if client is None or collection isn't truly there
    return client

qdrant = get_qdrant_client_and_ensure_collection() # Global qdrant client instance


def get_content_hash(content: str) -> str:
    """Generates a SHA-256 hash for the given content."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def embed_text(text: str): # Renamed from 'embed' to be more specific
    """Generates embedding for the given text using OpenAI."""
    if not text:
        print("⚠️ Cannot embed empty text.")
        return None
    try:
        response = client.embeddings.create(input=[text], model="text-embedding-3-small")
        return response.data[0].embedding
    except Exception as e:
        print(f"❌ Error generating embedding: {e}")
        return None


def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False


def get_qdrant_id(metadata: dict, file_stem: str) -> str:
    """Determines the ID to use for Qdrant (UUID preferably)."""
    # Prefer id or uuid from frontmatter
    q_id = metadata.get('uuid') or metadata.get('id')
    if q_id:
        # If it's a valid UUID, use it directly.
        if is_valid_uuid(q_id):
            return str(q_id)
        # Otherwise, generate a deterministic UUID from the string identifier.
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, q_id))

    # Fallback: generate a new UUID based on the file stem if no id/uuid is present.
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, file_stem))


def process_and_embed_loop_file(file_path_str: str):
    """Loads a loop file, extracts content and metadata, generates embedding, and upserts to Qdrant."""
    file_path = Path(file_path_str)
    if not file_path.exists():
        print(f"❌ File not found: {file_path_str}")
        return

    try:
        post = frontmatter.load(file_path)
        content = post.content
        metadata = post.metadata
        file_stem = file_path.stem # Original filename stem for reference
        
        qdrant_id = get_qdrant_id(metadata, file_stem)
        print(f"ℹ️ Using Qdrant ID: {qdrant_id} for file: {file_path.name}")

        if not content.strip():
            print(f"⚠️ Skipped embedding for {file_stem} (ID: {qdrant_id}) (empty content).")
            return

        current_hash = get_content_hash(content)

        try:
            retrieved_points = qdrant.retrieve(collection_name=QDRANT_COLLECTION_NAME, ids=[qdrant_id])
            existing_point = retrieved_points[0] if retrieved_points else None
            
            if existing_point and existing_point.payload and existing_point.payload.get("content_hash") == current_hash:
                print(f"ℹ️ Loop ID {qdrant_id} ({file_stem}) already up-to-date in Qdrant. Skipping.")
                return
        except QdrantUnexpectedResponse as qe: # Catch Qdrant specific API errors for retrieve.
            if hasattr(qe, 'status_code') and qe.status_code == 404: # Point not found is expected for new items
                 print(f"ℹ️ Point ID {qdrant_id} not found in Qdrant. Proceeding to embed.")
            elif hasattr(qe, 'content') and "is not a valid point ID" in str(qe.content): # Defensive check
                print(f"❌ Error: Generated Qdrant ID '{qdrant_id}' is invalid for Qdrant: {qe.content}. Skipping file {file_stem}.")
                return
            else:
                print(f"⚠️ Could not verify existing point for ID {qdrant_id} ({file_stem}) due to Qdrant error: {qe}. Proceeding with upsert attempt.")
        except Exception as e: 
            print(f"⚠️ Could not verify existing point for ID {qdrant_id} ({file_stem}) due to general error: {e}. Proceeding with upsert attempt.")

        vector = embed_text(content)
        if vector is None:
            print(f"❌ Failed to generate embedding for {file_stem} (ID: {qdrant_id}). Skipping Qdrant update.")
            return

        payload = {
            "path": str(file_path),
            "file_stem": file_stem, # Store original file stem
            "title": metadata.get("title", file_stem), 
            "tags": metadata.get("tags", []),
            "created_at": metadata.get("created_at", datetime.now().isoformat()),
            "content_hash": current_hash,
            **{k: v for k, v in metadata.items() if k not in ["title", "tags", "created_at", "id", "uuid"]}
        }

        qdrant.upsert(
            collection_name=QDRANT_COLLECTION_NAME,
            points=[PointStruct(id=qdrant_id, vector=vector, payload=payload)],
        )
        print(f"✅ Embedded and updated Qdrant for ID: {qdrant_id} ({file_path.name})")

    except Exception as e:
        print(f"❌ Failed to process or embed {file_path.name}: {e}")


# The following functions are part of the old resync logic.
# They can be kept if bulk resync is still desired as a separate functionality,
# or removed if this script is now solely for single-file updates.
# For now, I will keep them but they won\'t be called when a file_path is provided.

def get_last_sync():
    # This refers to EMBED_TRACK_FILE which was commented out.
    # If keeping resync, ensure EMBED_TRACK_FILE is correctly defined, possibly in src.path_config
    embed_track_file_path = Path("src/memory/embed_track.txt") # Placeholder if src.path_config.EMBED_TRACK_FILE is not used
    if not embed_track_file_path.exists():
        return datetime.min
    timestamp = embed_track_file_path.read_text().strip()
    return datetime.fromisoformat(timestamp)


def update_last_sync():
    embed_track_file_path = Path("src/memory/embed_track.txt") # Placeholder
    embed_track_file_path.write_text(datetime.now().isoformat())


def resync_embeddings():
    """Resyncs embeddings for all files in predefined directories based on modification time."""
    print("Starting bulk embedding resync...")
    last_sync = get_last_sync()
    # These paths were hardcoded. Consider making them configurable if keeping this.
    files_programs = list(Path("/Users/air/AIR01/02 Workstreams/Programs").glob("*.md"))
    files_projects = list(Path("/Users/air/AIR01/02 Workstreams/Projects").glob("*.md"))
    files = files_programs + files_projects

    processed_count = 0
    for file_path in files:
        try:
            # Check if file was modified since last sync
            if datetime.fromtimestamp(file_path.stat().st_mtime) > last_sync:
                print(f"🔄 Resyncing: {file_path.name}")
                # Reuse the single file processing logic
                # For resync, we might not need the detailed hash check if we rely on mtime,
                # but using process_and_embed_loop_file ensures consistency.
                # However, process_and_embed_loop_file loads frontmatter which might be slow for many files.
                # For simplicity now, directly calling embed and upsert for resync as before.
                content = file_path.read_text()
                if not content.strip():
                    print(f"⚠️ Skipped resync for {file_path.name} (empty content).")
                    continue
                
                vector = embed_text(content)
                if vector:
                    qdrant.upsert(
                        collection_name=QDRANT_COLLECTION_NAME,
                        points=[PointStruct(id=file_path.stem, vector=vector, payload={"path": str(file_path)})],
                    )
                    print(f"✅ Re-embedded during resync: {file_path.name}")
                    processed_count += 1
                else:
                    print(f"❌ Failed to generate embedding for {file_path.name} during resync.")
            else:
                # print(f" फाइल {file_path.name} has not been modified since last sync.")
                pass


        except Exception as e:
            print(f"❌ Error resyncing {file_path.name}: {e}")
    
    if processed_count > 0:
        update_last_sync()
    print(f"✅ Resync complete. Processed {processed_count} modified files.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Update Qdrant embeddings for loop files.")
    parser.add_argument(
        "file_path",
        nargs="?", # Makes the argument optional
        type=str,
        help="Path to the specific loop .md file to process. If not provided, runs full resync."
    )
    args = parser.parse_args()

    if args.file_path:
        print(f"Processing single file: {args.file_path}")
        process_and_embed_loop_file(args.file_path)
    else:
        print("No specific file provided, running full resync...")
        # resync_embeddings() # Kept the old resync logic callable if no args provided.
                            # Or, we can raise an error if file_path is mandatory for __main__
        print("No file path provided. To embed a specific file, pass its path as an argument.")
        print("To run a full resync (if configured), call resync_embeddings() directly or modify main.")
