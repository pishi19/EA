import logging
import os

import openai
import yaml
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models

load_dotenv()

LOOP_DIR = "runtime/loops"
QDRANT_URL = os.getenv("QDRANT_URL")
COLLECTION_NAME = "workstream_items"

def reembed_loop_by_uuid(uuid: str) -> bool:
    try:
        # Find loop file
        for filename in os.listdir(LOOP_DIR):
            if not filename.startswith("loop-") or not filename.endswith(".md"):
                continue
            path = os.path.join(LOOP_DIR, filename)
            with open(path, encoding="utf-8") as f:
                content = f.read()
            if not content.startswith("---"):
                continue
            parts = content.split("---", 2)
            if len(parts) < 3:
                continue
            front = yaml.safe_load(parts[1])
            if str(front.get("uuid", "")).strip() != uuid.strip():
                continue

            # Prepare embedding
            full_text = f"{front.get('title', '')}\n\n{parts[2].strip()}"
            openai.api_key = os.getenv("OPENAI_API_KEY")
            embedding = openai.Embedding.create(
                model="text-embedding-3-small",
                input=full_text
            )["data"][0]["embedding"]

            # Upsert to Qdrant
            client = QdrantClient(url=QDRANT_URL)
            client.upsert(
                collection_name=COLLECTION_NAME,
                points=[
                    models.PointStruct(
                        id=uuid,
                        vector=embedding,
                        payload={
                            "uuid": uuid,
                            "title": front.get("title", ""),
                            "tags": front.get("tags", []),
                            "summary": front.get("summary", ""),
                            "content": parts[2].strip(),
                        }
                    )
                ]
            )
            logging.info(f"✅ Re-embedded loop {uuid} into Qdrant.")
            return True
    except Exception as e:
        logging.error(f"❌ Failed to re-embed loop {uuid}: {e}")
        return False
    return False
