import os
from pathlib import Path
import faiss
import pickle
import openai
from typing import List, Tuple
import numpy as np
from openai import OpenAI

# === CONFIG ===
EMBED_MODEL = "text-embedding-3-small"
DATA_DIRS = [
    Path("/Users/air/AIR01/Retrospectives"),
    Path("/Users/air/AIR01/System"),
    Path("/Users/air/AIR01/0001 HQ")
]
INDEX_PATH = Path("/Users/air/ea_assistant/vector_index/faiss_index.idx")
META_PATH = Path("/Users/air/ea_assistant/vector_index/chunk_metadata.pkl")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# === EMBEDDING ===
def embed_text(text: str) -> List[float]:
    response = client.embeddings.create(model=EMBED_MODEL, input=[text])
    return response.data[0].embedding

# === CHUNKING ===
def chunk_markdown(file_path: Path, max_chars=800) -> List[Tuple[str, str]]:
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
def build_vector_index():
    all_chunks = []
    for directory in DATA_DIRS:
        for md_file in directory.rglob("*.md"):
            all_chunks.extend(chunk_markdown(md_file))

    print(f"Embedding {len(all_chunks)} chunks...")

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

    print(f"Indexed {len(vectors)} chunks to {INDEX_PATH}")

# === QUERYING ===
def query_vector_memory(query: str, top_k=5) -> List[Tuple[str, str]]:
    if not INDEX_PATH.exists() or not META_PATH.exists():
        raise FileNotFoundError("Vector index or metadata not found.")

    index = faiss.read_index(str(INDEX_PATH))
    with META_PATH.open("rb") as f:
        metadata = pickle.load(f)

    query_vec = embed_text(query)
    D, I = index.search(np.array([query_vec]).astype("float32"), top_k)

    results = []
    for idx in I[0]:
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
