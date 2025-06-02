import yaml
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, Any # Added for type hinting

# Assuming src.qdrant.query handles OpenAI and Qdrant client initialization
from src.qdrant.query import embed_text, get_qdrant_client # Changed to import get_qdrant_client
from qdrant_client.http import models # For PointStruct if needed later

# Determine project root assuming this script is in src/memory/resync_qdrant_and_manifest.py
project_root = Path(__file__).resolve().parent.parent.parent
LOOP_DIR = project_root / "runtime/loops"
MANIFEST_PATH = project_root / ".system_manifest.yaml"
COLLECTION_NAME = "workstream_items" # Consistent with src.qdrant.query

def sha256_text(text: str) -> str:
    """Computes SHA256 hash of the given text."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def extract_frontmatter(file_path: Path) -> Dict[str, Any]:
    """Extracts frontmatter from a markdown file."""
    try:
        content = file_path.read_text(encoding="utf-8")
        parts = content.split("---", 2)
        if len(parts) >= 3:
            frontmatter = yaml.safe_load(parts[1])
            if isinstance(frontmatter, dict):
                return frontmatter
            else:
                print(f"Warning: Frontmatter in {file_path.name} is not a dictionary. Returning empty.")
                return {}
        else:
            print(f"Warning: No frontmatter found in {file_path.name}. Returning empty.")
            return {}
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return {}
    except yaml.YAMLError as e:
        print(f"Error parsing YAML frontmatter in {file_path.name}: {e}")
        return {}
    except Exception as e:
        print(f"An unexpected error occurred while extracting frontmatter from {file_path.name}: {e}")
        return {}

def update_manifest_entry(manifest: Dict[str, Any], file_path: Path, uuid: str, content_hash: str):
    """Updates a single entry in the manifest dictionary."""
    # Use relative path string for manifest keys for consistency
    relative_path_str = str(file_path.relative_to(project_root))
    manifest[relative_path_str] = {
        "uuid": uuid,
        "hash": content_hash,
        "last_updated": datetime.now().isoformat()
    }

def main():
    print(f"Starting Qdrant and Manifest resync process.")
    print(f"Monitoring loop directory: {LOOP_DIR}")
    print(f"Manifest file: {MANIFEST_PATH}")

    qclient = get_qdrant_client() # Get Qdrant client instance
    if not qclient:
        print("❌ Qdrant client not available. Aborting sync process.")
        return

    try:
        manifest_content = MANIFEST_PATH.read_text(encoding="utf-8") if MANIFEST_PATH.exists() else "{}"
        manifest = yaml.safe_load(manifest_content) or {}
        if not isinstance(manifest, dict):
            print(f"Warning: Manifest content at {MANIFEST_PATH} is not a dictionary. Initializing empty manifest.")
            manifest = {}
    except yaml.YAMLError as e:
        print(f"Error parsing manifest YAML from {MANIFEST_PATH}: {e}. Initializing empty manifest.")
        manifest = {}
    except Exception as e:
        print(f"An unexpected error occurred reading manifest {MANIFEST_PATH}: {e}. Initializing empty manifest.")
        manifest = {}

    if not LOOP_DIR.exists():
        print(f"⚠️ Loop directory {LOOP_DIR} does not exist. Creating it.")
        LOOP_DIR.mkdir(parents=True, exist_ok=True)
    
    processed_files = 0
    for file_path in LOOP_DIR.glob("*.md"):
        print(f"\nProcessing file: {file_path.name}")
        try:
            content = file_path.read_text(encoding="utf-8")
            frontmatter = extract_frontmatter(file_path)
            
            uuid = frontmatter.get("uuid")
            if not uuid:
                print(f"⚠️ Skipping {file_path.name}, no UUID in frontmatter.")
                continue
            
            # Check if file needs update based on hash (optional optimization)
            current_hash = sha256_text(content)
            relative_path_str = str(file_path.relative_to(project_root))
            if manifest.get(relative_path_str, {}).get("hash") == current_hash:
                print(f"⚪️ Skipping {file_path.name}, content hash unchanged.")
                # Optionally update last_updated timestamp if desired even if hash is same
                # update_manifest_entry(manifest, file_path, uuid, current_hash)
                continue

            print(f"  Embedding content for {file_path.name} (UUID: {uuid})...")
            embedding = embed_text(content) # This can raise exceptions if OpenAI key is missing or API fails
            
            point_payload = {
                "filename": str(file_path.name), # Storing only filename, not full path
                "uuid": uuid,
                "project": frontmatter.get("project"),
                "phase": frontmatter.get("phase"),
                "tags": frontmatter.get("tags", []),
                 # Add other relevant frontmatter fields to payload as needed
                "source": frontmatter.get("source"),
                "created": frontmatter.get("created")
            }
            # Remove None values from payload to keep it clean
            point_payload = {k: v for k, v in point_payload.items() if v is not None}

            print(f"  Upserting to Qdrant collection '{COLLECTION_NAME}'...")
            qclient.upsert(
                collection_name=COLLECTION_NAME,
                points=[
                    models.PointStruct(
                        id=uuid, 
                        vector=embedding, 
                        payload=point_payload
                    )
                ]
            )

            update_manifest_entry(manifest, file_path, uuid, current_hash)
            print(f"✅ Embedded and manifest updated for: {file_path.name}")
            processed_files += 1

        except Exception as e:
            print(f"❌ Error processing {file_path.name}: {e}")
            import traceback
            traceback.print_exc() # Print full traceback for debugging
            continue # Move to the next file

    try:
        MANIFEST_PATH.write_text(yaml.safe_dump(manifest, sort_keys=False, indent=2), encoding="utf-8")
        print(f"\nProcessed {processed_files} files.")
        print("✅ Manifest successfully updated.")
    except Exception as e:
        print(f"❌ Error writing manifest file to {MANIFEST_PATH}: {e}")

if __name__ == "__main__":
    import os
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable not set.")
        print("Please set it before running the script (e.g., in a .env file).")
    else:
        if not any(LOOP_DIR.glob("*.md")):
            print(f"No .md files found in {LOOP_DIR}. Consider creating test files for a full run.")
            # Example: Create a dummy file for testing
            # dummy_uuid = "11111111-1111-1111-1111-111111111111"
            # dummy_content = f'''---
# uuid: {dummy_uuid}
# project: Test Project Alpha
# phase: "1.0"
# tags:
# - test
# - dummy
# source: script_test
# created: {datetime.now().isoformat()}
# ---
#
# This is a dummy loop file created for testing the resync script.
# #test #dummy''' # Corrected commenting for the multi-line f-string content
            # dummy_file_path = LOOP_DIR / "dummy-test-loop.md"
            # try:
            #     dummy_file_path.write_text(dummy_content, encoding="utf-8")
            #     print(f"Created dummy file: {dummy_file_path}")
            # except Exception as e:
            #     print(f"Error creating dummy file: {e}")
        main() 