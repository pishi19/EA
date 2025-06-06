import logging
import os
import pickle
from pathlib import Path

import faiss
import numpy as np
from openai import OpenAI

from src.path_config import INDEX_PATH, META_PATH

# === CONFIG ===
EMBED_MODEL = "text-embedding-3-small"
DATA_DIRS = [
    Path("/Users/air/AIR01/Retrospectives"),
    Path("/Users/air/AIR01/System"),
    Path("/Users/air/AIR01/0001 HQ"),
]
INDEX_PATH = INDEX_PATH
META_PATH = META_PATH

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# === EMBEDDING ===
def embed_text(text: str) -> list[float]:
    response = client.embeddings.create(model=EMBED_MODEL, input=[text])
    return response.data[0].embedding


# === CHUNKING ===
def chunk_markdown(file_path: Path, max_chars: int = 800) -> list[tuple[str, str]]:
    chunks = []
    current = []
    count = 0

    for line in file_path.read_text(errors="ignore").splitlines():
        if count + len(line) > max_chars:
            if current:
                chunks.append(("\n".join(current), str(file_path)))
            current = [line]
            count = len(line)
        else:
            current.append(line)
            count += len(line)

    if current:
        chunks.append(("\n".join(current), str(file_path)))

    return chunks


# === INDEXING ===
def build_vector_index() -> None:
    all_chunks = []
    for directory in DATA_DIRS:
        for md_file in directory.rglob("*.md"):
            all_chunks.extend(chunk_markdown(md_file))

    logger.info(f"Embedding {len(all_chunks)} chunks...")

    vectors = []
    metadata = []

    for chunk_text, source in all_chunks:
        embedding = embed_text(chunk_text)
        vectors.append(embedding)
        metadata.append({"source": source, "text": chunk_text})

    dim = len(vectors[0])
    index = faiss.IndexFlatL2(dim)
    index.add(np.array(vectors).astype("float32"))

    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(INDEX_PATH))

    with META_PATH.open("wb") as f:
        pickle.dump(metadata, f)

    logger.info(f"Indexed {len(vectors)} chunks to {INDEX_PATH}")


# === QUERYING ===
def query_vector_memory(query: str, top_k: int = 5) -> list[tuple[str, str]]:
    if not INDEX_PATH.exists() or not META_PATH.exists():
        logger.error("Vector index or metadata not found.")
        raise FileNotFoundError("Vector index or metadata not found.")

    index = faiss.read_index(str(INDEX_PATH))
    with META_PATH.open("rb") as f:
        metadata = pickle.load(f)

    query_vec = embed_text(query)
    D, indices = index.search(np.array([query_vec]).astype("float32"), top_k)

    results = []
    for idx in indices[0]:
        meta = metadata[idx]
        results.append((meta["source"], meta["text"]))

    return results


# === CLI USAGE ===
if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        question = " ".join(sys.argv[1:])
        results = query_vector_memory(question)
        print("\n--- Top Matches ---\n")
        for source, text in results:
            print(f"Source: {source}\n{text}\n---\n")
    else:
        build_vector_index()
