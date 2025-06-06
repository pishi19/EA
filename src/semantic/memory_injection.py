import logging
import os
from typing import Dict, List

# Load environment variables from .env file
from dotenv import load_dotenv

load_dotenv()

# These are third-party libraries. Ensure they are installed in your environment.
# e.g., via pip install openai qdrant-client
from openai import (
    OpenAI,  # Removed APIError as it's not directly used in a way that requires its specific type for generic except block
)
from qdrant_client import QdrantClient

# from qdrant_client.http.exceptions import QdrantException # Not used directly for generic except block

# Setup basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Environment variables - these should be configured in your environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")  # This is optional for Qdrant, depending on its configuration

# Constants
QDRANT_COLLECTION_NAME = "workstream_items"
EMBEDDING_MODEL = "text-embedding-ada-002"
EXPECTED_LOOP_METADATA_KEYS = ["title", "uuid", "tags", "summary", "content"]


def get_top_k_loops_for_query(query: str, k: int = 3) -> List[Dict]:
    """
    Retrieves the top-k most relevant loops for a given query from Qdrant.

    The function embeds the query using OpenAI, then queries a Qdrant
    collection for the most similar items based on cosine similarity.
    It handles potential errors such as connection issues, no matches,
    or missing metadata in the retrieved loops.

    Args:
        query: The search query string.
        k: The number of top loops to retrieve (default is 3).

    Returns:
        A list of dictionaries, where each dictionary represents a loop
        and contains 'title', 'uuid', 'tags', 'summary', and 'content'.
        Returns an empty list if a critical error occurs (e.g., API key missing,
        Qdrant unavailable) or if no valid loops are found.
    """
    if not OPENAI_API_KEY:
        logger.error("OPENAI_API_KEY environment variable is not set. Cannot get embeddings.")
        return []
    if not QDRANT_URL:
        logger.error("QDRANT_URL environment variable is not set. Cannot connect to Qdrant.")
        return []

    # 1. Embed the query using OpenAI embeddings
    query_embedding: List[float]
    try:
        client_openai = OpenAI(api_key=OPENAI_API_KEY)
        response = client_openai.embeddings.create(
            input=[query],
            model=EMBEDDING_MODEL
        )
        query_embedding = response.data[0].embedding
    except Exception as e:
        logger.error(f"Failed to get embeddings from OpenAI for query '{query[:50]}...': {e}")
        return []

    # 2. Query Qdrant `workstream_items` collection
    search_result = []
    try:
        # Initialize Qdrant client.
        # For cloud, QDRANT_URL and QDRANT_API_KEY are typically used.
        # For local, QDRANT_URL (e.g. "http://localhost:6333") is used.
        client_qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

        # It's good practice to check collection existence or handle errors from search robustly.
        # client_qdrant.get_collection(QDRANT_COLLECTION_NAME) # Could be used for an explicit check

        search_result = client_qdrant.search(
            collection_name=QDRANT_COLLECTION_NAME,
            query_vector=query_embedding,
            limit=k,
            with_payload=True,  # Crucial to get the metadata
            with_vectors=False # We don't need to retrieve the vectors themselves
            # score_threshold can be added if a minimum similarity is desired
        )
    except Exception as e:
        # This can catch various issues: network, collection not found, auth, etc.
        logger.error(f"Qdrant query failed for collection '{QDRANT_COLLECTION_NAME}': {e}")
        return []

    # 3. Process results and return a list of loop dicts
    if not search_result:
        logger.info(f"No matches found in Qdrant collection '{QDRANT_COLLECTION_NAME}' for query: '{query[:50]}...'")
        return []

    loops_found: List[Dict] = []
    for hit in search_result:
        payload = hit.payload
        if payload is None:
            logger.warning(f"Skipping Qdrant hit with id {hit.id} as it has no payload.")
            continue

        # Validate that all expected metadata keys are present in the payload
        missing_keys = [key for key in EXPECTED_LOOP_METADATA_KEYS if key not in payload]
        if missing_keys:
            loop_identifier = payload.get('uuid', f"Qdrant ID {hit.id}")
            logger.warning(
                f"Skipping loop '{loop_identifier}' due to missing metadata: {', '.join(missing_keys)}. "
                f"Available keys: {list(payload.keys())}"
            )
            continue

        # Ensure 'tags' is a list, defaulting to an empty list if not or if it's not the right type.
        tags = payload.get("tags", [])
        if not isinstance(tags, list):
            loop_identifier = payload.get('uuid', f"Qdrant ID {hit.id}")
            logger.warning(f"Loop '{loop_identifier}' has 'tags' field that is not a list: {tags}. Normalizing to empty list.")
            tags = []

        loop_dict = {
            "title": payload["title"],
            "uuid": payload["uuid"],
            "tags": tags,
            "summary": payload["summary"],
            "content": payload["content"]  # 'content' is assumed to be the 'excerpt' requested
        }
        loops_found.append(loop_dict)

    if not loops_found:
         logger.info(f"No valid loops (with all required metadata) found after filtering Qdrant results for query: '{query[:50]}...'")

    return loops_found


def format_loops_for_prompt(loops: List[dict]) -> str:
    """Formats a list of loops into a markdown-style string block for GPT injection."""
    formatted_blocks = []
    for loop in loops:
        header = (
            f"---\\\\n"
            f"loop_title: \\\\\\\"{loop.get('title', '')}\\\\\\\"\\\\n"
            f"loop_uuid: \\\\\\\"{loop.get('uuid', '')}\\\\\\\"\\\\n"
            f"summary: \\\\\\\"{loop.get('summary', '')}\\\\\\\"\\\\n"
            f"tags: {loop.get('tags', [])}\\\\n"
            f"---\\\\n"
        )
        content_excerpt = loop.get('content', '').strip().split('\\\\n')[:3]
        block = header + "content: |\\\\n  " + "\\\\n  ".join(content_excerpt)
        formatted_blocks.append(block)
    return "\\\\n\\\\n".join(formatted_blocks)

if __name__ == '__main__':
    # Example Usage (requires environment variables to be set)
    # Ensure OPENAI_API_KEY and QDRANT_URL (and QDRANT_API_KEY if needed) are set.
    # Also, ensure your Qdrant instance is running, the collection exists, and has data.

    logger.info("Starting example usage of get_top_k_loops_for_query...")

    if not OPENAI_API_KEY or not QDRANT_URL:
        logger.warning("OPENAI_API_KEY or QDRANT_URL environment variables are not set.")
        logger.warning("Skipping example usage as it will fail.")
    else:
        example_query = "example query about project management"
        logger.info(f"Test query: '{example_query}'")

        try:
            # Attempt to connect to Qdrant to check if the server is available and the collection exists
            # This is a more direct check before running the main function for the example.
            q_client_test = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=5)
            q_client_test.get_collection(collection_name=QDRANT_COLLECTION_NAME)
            logger.info(f"Successfully connected to Qdrant and collection '{QDRANT_COLLECTION_NAME}' seems to exist.")

            top_loops = get_top_k_loops_for_query(example_query, k=2)

            if top_loops:
                logger.info(f"Found {len(top_loops)} loops:")
                for i, loop in enumerate(top_loops):
                    logger.info(f"Loop {i+1}:")
                    logger.info(f"  Title: {loop['title']}")
                    logger.info(f"  UUID: {loop['uuid']}")
                    logger.info(f"  Tags: {loop['tags']}")
                    logger.info(f"  Summary (first 50 chars): {str(loop['summary'])[:50]}...")
                    logger.info(f"  Content (first 50 chars): {str(loop['content'])[:50]}...")
            else:
                logger.info("No loops found for the example query, or an error occurred during the process.")
                logger.info("This might be expected if your Qdrant collection is empty or does not contain relevant items.")

        except Exception as e:
            logger.error(f"Could not run example: {e}")
            logger.error("Please ensure Qdrant is running, the collection "
                         f"'{QDRANT_COLLECTION_NAME}' exists, and it's populated with data.")
            logger.error("Also, verify QDRANT_URL and any necessary QDRANT_API_KEY.")

        # New test code provided by the user
        print("\n\n------------------------------------------")
        print("Running new test with a specific query:")
        print("------------------------------------------")
        query = "How does semantic memory work in Ora?"
        print(f"Test Query: {query}")
        top_loops_specific = get_top_k_loops_for_query(query, k=3) # Renamed to avoid conflict with 'top_loops' above

        if not top_loops_specific:
            print("🔍 No loops retrieved for the specific query. This might be due to an empty/irrelevant DB or issues.")
        else:
            print("\n🔍 Top 3 Loops Retrieved:")
            for i, loop in enumerate(top_loops_specific, 1):
                print(f"\n--- Loop {i} ---")
                print(f"Title: {loop.get('title')}")
                print(f"UUID: {loop.get('uuid')}")
                print(f"Tags: {loop.get('tags')}")
                print(f"Summary: {loop.get('summary')}")
                # Ensure content is a string before slicing
                content_str = str(loop.get('content', ''))
                print(f"Content: {content_str[:120]}...")

            print("\n\n🧠 Injected Prompt Block:\n")
            formatted_prompt = format_loops_for_prompt(top_loops_specific)
            if not formatted_prompt.strip(): # Check if the formatted prompt is empty or just whitespace
                print("No content to display for prompt block (possibly all loops were filtered or had no content).")
            else:
                print(formatted_prompt)
        print("------------------------------------------\n")

    logger.info("Example usage finished.")
