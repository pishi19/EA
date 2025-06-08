import os
import sqlite3

import numpy as np
import pandas as pd
from openai import OpenAI


# --- Embedding Utility (could be shared) ---
def get_embedding(text, model="text-embedding-ada-002"):
    """Generates an embedding for the given text using OpenAI."""
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.embeddings.create(input=[text], model=model)
        return np.array(response.data[0].embedding).astype(np.float32)
    except Exception as e:
        print(f"Error getting embedding for '{text}': {e}")
        return None

# --- Cosine Similarity ---
def cosine_similarity(v1, v2):
    """Computes cosine similarity between two vectors."""
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return dot_product / (norm_v1 * norm_v2)

# --- Main Similarity Logic ---
def find_similar_tasks(verb: str, threshold: float = 0.85, db_path="runtime/db/ora.db"):
    """Finds tasks with verbs semantically similar to the input verb."""
    input_vector = get_embedding(verb)
    if input_vector is None:
        return {"error": "Could not generate embedding for the input verb."}

    conn = sqlite3.connect(db_path)
    try:
        # Fetch all tasks and their vectors
        tasks_df = pd.read_sql("SELECT uuid, workstream, verb, vector, source_loop_id FROM tasks", conn)
    except pd.io.sql.DatabaseError:
        return {"error": "The 'tasks' table does not exist. Please run the indexer first."}
    finally:
        conn.close()

    if tasks_df.empty:
        return []

    similar_tasks = []
    for index, row in tasks_df.iterrows():
        # The vector dimension is 1536 for text-embedding-ada-002
        stored_vector = np.frombuffer(row['vector'], dtype=np.float32)

        # Ensure vectors are of the same dimension before comparing
        if stored_vector.shape != input_vector.shape:
            print(f"Skipping task {row['uuid']} due to mismatched vector dimensions.")
            continue

        similarity = cosine_similarity(input_vector, stored_vector)

        if similarity >= threshold:
            similar_tasks.append({
                "task_uuid": row['uuid'],
                "verb": row['verb'],
                "workstream": row['workstream'],
                "similarity": float(round(similarity, 4)),
                "source_loop_id": row['source_loop_id']
            })

    # Sort by similarity score, descending
    return sorted(similar_tasks, key=lambda x: x['similarity'], reverse=True)
