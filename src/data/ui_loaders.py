import sqlite3
import os
import frontmatter
from pathlib import Path

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
        all_loop_files_by_uuid = {frontmatter.load(loops_dir / f).get("uuid"): f for f in os.listdir(loops_dir) if f.endswith(".md")}
        for loop in all_loops:
            if loop["uuid"] in all_loop_files_by_uuid and loop["uuid"] not in promoted_uuids:
                promotable_loops.append(loop)

    return promotable_loops 