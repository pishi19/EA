import os
import sqlite3
import uuid

import numpy as np
import pandas as pd
from openai import OpenAI


# --- Utility Functions ---
def get_embedding(text, model="text-embedding-ada-002"):
    """Generates an embedding for the given text using OpenAI."""
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.embeddings.create(input=[text], model=model)
        return response.data[0].embedding
    except Exception as e:
        print(f"Error getting embedding for '{text}': {e}")
        return None

def extract_verb_from_title(title):
    """A simple heuristic to extract a 'verb' from a loop title."""
    if not title or not isinstance(title, str):
        return None
    # For now, we treat the whole title as the core "task"
    return title.strip()

# --- Main Indexing Logic ---
def index_task_verbs(db_path="runtime/db/ora.db"):
    """Indexes task verbs from active loops into the 'tasks' table."""
    print("🚀 Starting task verb indexing...")
    conn = sqlite3.connect(db_path)

    # Ensure the schema is up-to-date
    with open("runtime/db/schema.sql") as f:
        conn.executescript(f.read())

    # Load active/pending loops
    try:
        loops_df = pd.read_sql(
            "SELECT uuid, title, workstream FROM loop_metadata WHERE status IN ('active', 'pending')",
            conn
        )
    except pd.io.sql.DatabaseError:
        print("❌ `loop_metadata` table not found or query failed. Stopping.")
        conn.close()
        return

    print(f"Found {len(loops_df)} active/pending loops to index.")

    tasks_to_insert = []
    for index, row in loops_df.iterrows():
        verb = extract_verb_from_title(row['title'])
        if not verb:
            continue

        vector = get_embedding(verb)
        if not vector:
            print(f"Skipping loop {row['uuid']} due to embedding failure.")
            continue

        # Convert vector to bytes for BLOB storage
        vector_blob = np.array(vector).astype(np.float32).tobytes()

        tasks_to_insert.append((
            str(uuid.uuid4()),
            row['workstream'],
            verb,
            vector_blob,
            row['uuid']
        ))

    if tasks_to_insert:
        cur = conn.cursor()
        cur.executemany(
            "INSERT OR REPLACE INTO tasks (uuid, workstream, verb, vector, source_loop_id) VALUES (?, ?, ?, ?, ?)",
            tasks_to_insert
        )
        conn.commit()
        print(f"✅ Indexed {len(tasks_to_insert)} task verbs.")
    else:
        print("No new tasks to index.")

    conn.close()

if __name__ == "__main__":
    if not os.getenv("OPENAI_API_KEY"):
        print("🚨 OPENAI_API_KEY environment variable not set. Please set it to run the indexer.")
    else:
        index_task_verbs()
