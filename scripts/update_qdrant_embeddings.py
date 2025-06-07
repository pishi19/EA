import glob
import logging
import os
import uuid

import yaml

# Load environment variables from .env file
from dotenv import load_dotenv
from openai import OpenAI
from qdrant_client import QdrantClient, models
from qdrant_client.http.exceptions import UnexpectedResponse

load_dotenv()

# --- Configuration ---
# Setup basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Environment variables (ensure these are set in your execution environment)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL") # e.g., "http://localhost:6333"

# Constants
LOOPS_DIR = "runtime/loops"
MD_FILE_PATTERN = "loop-*.md"
QDRANT_COLLECTION_NAME = "workstream_items"
EMBEDDING_MODEL = "text-embedding-3-small" # OpenAI model for embeddings
EMBEDDING_DIMENSIONS = 1536 # Dimensions for text-embedding-3-small

# --- Helper Functions ---

def parse_md_file(file_path):
    """
    Parses a markdown file to extract YAML frontmatter and content.
    Returns a tuple (metadata_dict, content_string) or (None, None) if parsing fails.
    """
    try:
        with open(file_path, encoding='utf-8') as f:
            content = f.read()

        if not content.startswith("---"):
            logger.warning(f"File {file_path} does not appear to have YAML frontmatter. Skipping.")
            return None, None

        parts = content.split('---', 2)
        if len(parts) < 3:
            logger.warning(f"Could not properly parse frontmatter in {file_path}. Skipping.")
            return None, None

        frontmatter_str = parts[1]
        main_content_str = parts[2].strip()

        metadata = yaml.safe_load(frontmatter_str)
        if not isinstance(metadata, dict):
            logger.warning(f"Frontmatter in {file_path} is not a valid YAML dictionary. Skipping.")
            return None, None

        return metadata, main_content_str
    except yaml.YAMLError as e:
        logger.error(f"YAML parsing error in {file_path}: {e}. Skipping.")
        return None, None
    except Exception as e:
        logger.error(f"Error reading or processing file {file_path}: {e}. Skipping.")
        return None, None

# --- Main Script Logic ---

def main():
    logger.info("Starting Qdrant embedding update script...")

    if not OPENAI_API_KEY:
        logger.error("OPENAI_API_KEY environment variable is not set. Exiting.")
        return
    if not QDRANT_URL:
        logger.error("QDRANT_URL environment variable is not set. Exiting.")
        return

    # Initialize OpenAI client
    try:
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("OpenAI client initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {e}. Exiting.")
        return

    # Initialize Qdrant client
    try:
        qdrant_client = QdrantClient(url=QDRANT_URL)
        logger.info(f"Qdrant client initialized with URL: {QDRANT_URL}")
    except Exception as e:
        logger.error(f"Failed to initialize Qdrant client (is Qdrant running at {QDRANT_URL}?): {e}. Exiting.")
        return

    # Ensure the collection exists
    try:
        collections = qdrant_client.get_collections()
        collection_names = [col.name for col in collections.collections]
        if QDRANT_COLLECTION_NAME not in collection_names:
            logger.info(f"Collection '{QDRANT_COLLECTION_NAME}' not found. Creating it...")
            qdrant_client.create_collection(
                collection_name=QDRANT_COLLECTION_NAME,
                vectors_config=models.VectorParams(size=EMBEDDING_DIMENSIONS, distance=models.Distance.COSINE)
            )
            logger.info(f"Collection '{QDRANT_COLLECTION_NAME}' created successfully.")
        else:
            logger.info(f"Collection '{QDRANT_COLLECTION_NAME}' already exists.")
    except UnexpectedResponse as e:
        logger.error(f"Error checking/creating Qdrant collection (is Qdrant server okay?): {e.status_code} - {e.content}. Exiting.")
        return
    except Exception as e:
        logger.error(f"An unexpected error occurred with Qdrant collection management: {e}. Exiting.")
        return

    # Process markdown files
    file_pattern = os.path.join(LOOPS_DIR, MD_FILE_PATTERN)
    md_files = glob.glob(file_pattern)

    if not md_files:
        logger.info(f"No markdown files found matching pattern '{file_pattern}'. Nothing to process.")
        return

    logger.info(f"Found {len(md_files)} markdown files to process in '{LOOPS_DIR}'.")
    points_to_upsert = []

    for md_file_path in md_files:
        logger.info(f"Processing file: {md_file_path}")
        metadata, content_text = parse_md_file(md_file_path)

        if not metadata or not content_text:
            logger.warning(f"Skipping {md_file_path} due to parsing issues or empty content.")
            continue

        loop_uuid = metadata.get('uuid')
        if not loop_uuid:
            logger.warning(f"No 'uuid' found in frontmatter for {md_file_path}. Skipping.")
            continue

        # Generate a deterministic UUID for the Qdrant point ID from the loop's string UUID.
        # This ensures the ID is always a valid UUID format for Qdrant.
        # The original string uuid from the file is preserved in the payload.
        qdrant_point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, str(loop_uuid)))

        loop_title = metadata.get('title', 'Untitled Loop')
        loop_tags = metadata.get('tags', [])
        loop_summary = metadata.get('summary', '')

        if not isinstance(loop_tags, list):
            logger.warning(f"Tags for {loop_uuid} in {md_file_path} is not a list. Using empty list. Original: {loop_tags}")
            loop_tags = []

        # Text to embed (can be content_text, summary, or a combination)
        # For now, embedding the full main content.
        text_to_embed = content_text
        if not text_to_embed.strip():
            logger.warning(f"Content for {loop_uuid} in {md_file_path} is empty after stripping. Skipping embedding.")
            continue

        try:
            logger.info(f"Generating embedding for loop UUID: {loop_uuid} (Title: {loop_title}) using model {EMBEDDING_MODEL}...")
            response = openai_client.embeddings.create(
                input=[text_to_embed],
                model=EMBEDDING_MODEL
            )
            embedding_vector = response.data[0].embedding
            logger.info(f"Embedding generated for {loop_uuid}.")
        except Exception as e:
            logger.error(f"Failed to generate embedding for {loop_uuid} from {md_file_path}: {e}. Skipping this loop.")
            continue

        payload = {
            "title": loop_title,
            "uuid": str(loop_uuid), # Ensure UUID is a string
            "tags": loop_tags,
            "summary": loop_summary,
            "content": content_text, # The full markdown content after frontmatter
            "original_source": md_file_path
        }

        points_to_upsert.append(models.PointStruct(
            id=qdrant_point_id, # Qdrant point ID must be a valid UUID
            vector=embedding_vector,
            payload=payload
        ))
        logger.info(f"Prepared point for {loop_uuid} (Qdrant ID: {qdrant_point_id}) from {md_file_path}.")

    if points_to_upsert:
        logger.info(f"Upserting {len(points_to_upsert)} points to Qdrant collection '{QDRANT_COLLECTION_NAME}'...")
        try:
            qdrant_client.upsert(
                collection_name=QDRANT_COLLECTION_NAME,
                points=points_to_upsert,
                wait=True # Wait for operation to complete
            )
            logger.info(f"Successfully upserted {len(points_to_upsert)} points.")
        except Exception as e:
            logger.error(f"Failed to upsert points to Qdrant: {e}")
    else:
        logger.info("No valid points were prepared for upsertion.")

    logger.info("Qdrant embedding update script finished.")

if __name__ == "__main__":
    # Check for dependencies early
    try:
        import openai
        import qdrant_client
        import yaml
    except ImportError as e:
        logger.error(f"Missing one or more required Python packages (PyYAML, openai, qdrant-client): {e}. Please install them.")
        exit(1)

    main()
