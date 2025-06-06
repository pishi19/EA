import sqlite3
import os
import frontmatter
from pathlib import Path
import pandas as pd

def load_promotable_loops(db_path, loops_dir, roadmap_dir):
    """
    Loads loops that exist in both the DB and filesystem, and have not been promoted.
    """
    # 1. Get promoted UUIDs
    promoted_uuids = set()
    if roadmap_dir.exists():
        for fname in os.listdir(roadmap_dir):
            if fname.endswith(".md"):
                try:
                    post = frontmatter.load(roadmap_dir / fname)
                    if "origin_loop" in post:
                        promoted_uuids.add(post["origin_loop"])
                except Exception:
                    pass

    # 2. Get all loops from DB
    all_loops = []
    if db_path.exists():
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT uuid, title, workstream, score FROM loop_metadata WHERE workstream IS NOT NULL")
        rows = cur.fetchall()
        conn.close()
        all_loops = [{"uuid": r[0], "title": r[1], "workstream": r[2], "score": r[3]} for r in rows]

    # 3. Filter for loops that exist in the filesystem and are not promoted
    promotable_loops = []
    if loops_dir.exists():
        all_loop_files_by_uuid = {}
        for f in os.listdir(loops_dir):
            if f.endswith(".md"):
                try:
                    post = frontmatter.load(loops_dir / f)
                    if "uuid" in post:
                        all_loop_files_by_uuid[post.get("uuid")] = f
                except Exception:
                    continue # Ignore malformed files
        
        for loop in all_loops:
            if loop["uuid"] in all_loop_files_by_uuid and loop["uuid"] not in promoted_uuids:
                promotable_loops.append(loop)

    return promotable_loops

def load_workstream_view_data(db_path, loops_dir):
    """
    Loads all workstreams from the DB and all loops from the filesystem.
    """
    workstreams = []
    if db_path.exists():
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT id, title, tags, goals, owners FROM workstreams")
        rows = cur.fetchall()
        conn.close()
        workstreams = [
            {"id": r[0], "title": r[1], "tags": r[2], "goals": r[3], "owners": r[4]}
            for r in rows
        ]

    all_loops = []
    print(f"\nDEBUG: Checking for loops in directory: '{loops_dir}'") # DEBUG
    if loops_dir.exists():
        files_in_dir = os.listdir(loops_dir)
        print(f"DEBUG: Found {len(files_in_dir)} items: {files_in_dir}") # DEBUG
        for fname in os.listdir(loops_dir):
            if fname.endswith(".md"):
                try:
                    post = frontmatter.load(loops_dir / fname)
                    metadata = post.metadata
                    all_loops.append({
                        "uuid": metadata.get("uuid"),
                        "title": metadata.get("title", "Untitled"),
                        "workstream": metadata.get("workstream"),
                        "status": metadata.get("status", "unknown"),
                        "tags": metadata.get("tags", []),
                        "content": post.content
                    })
                except Exception as e:
                    print(f"DEBUG: Error loading {fname}: {e}") # DEBUG
                    continue
    
    return workstreams, all_loops

def load_workstream_feedback_data(db_path):
    """
    Loads all data needed for the Workstream Feedback page.
    """
    if not db_path.exists():
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

    conn = sqlite3.connect(db_path)
    workstreams = pd.read_sql("SELECT id, title FROM workstreams", conn)
    loops = pd.read_sql("SELECT uuid, title, workstream, score FROM loop_metadata", conn)
    feedback = pd.read_sql("SELECT uuid, tag FROM loop_feedback", conn)
    conn.close()
    return workstreams, loops, feedback 