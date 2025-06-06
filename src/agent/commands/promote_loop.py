import sqlite3
import pandas as pd
import uuid
from datetime import datetime
from pathlib import Path
import frontmatter
import os

# Assuming similarity and other agent command functions are in sibling directories
# This might need adjustment based on final project structure.
from src.tasks.similarity import find_similar_tasks

# --- Constants ---
def find_project_root(marker=".git"):
    """Finds the project root by searching upwards for a marker file/directory."""
    path = Path.cwd()
    while path.parent != path:
        if (path / marker).exists():
            return path
        path = path.parent
    # Fallback for environments where CWD is not the project root (like some deployments)
    script_path_fallback = Path(__file__).resolve().parent.parent.parent
    if (script_path_fallback / marker).exists():
        return script_path_fallback
    raise FileNotFoundError(f"Project root with marker '{marker}' not found.")

PROJECT_ROOT = find_project_root()

def find_loop_file_by_uuid(loop_uuid: str) -> Path | None:
    """Finds the markdown file for a loop by its UUID."""
    loop_dir = PROJECT_ROOT / "runtime/loops"
    if not loop_dir.exists():
        return None
    for loop_file in loop_dir.glob("*.md"):
        try:
            post = frontmatter.load(loop_file)
            if post.get("uuid") == loop_uuid:
                return loop_file
        except Exception:
            # Ignore files that fail to parse
            continue
    return None

def promote_loop_to_roadmap(loop_uuid: str):
    """Creates a new roadmap markdown file from an existing loop."""
    loop_file = find_loop_file_by_uuid(loop_uuid)
    if not loop_file:
        return {"error": f"Loop with UUID '{loop_uuid}' not found in any .md file."}

    post = frontmatter.load(loop_file)
    
    roadmap_uuid = str(uuid.uuid4())
    today = datetime.now().strftime("%Y-%m-%d")
    
    new_content = f"Promoted from loop: '{post.get('title')}' ({loop_uuid})\n\n---\n\n" + post.content
    new_post = frontmatter.Post(
        content=new_content,
        handler=frontmatter.YAMLHandler()
    )
    new_post['uuid'] = roadmap_uuid
    new_post['origin_loop'] = loop_uuid
    new_post['phase'] = "8.x"  # Default as per prompt
    new_post['title'] = f"Roadmap: {post.get('title')}"
    new_post['tags'] = post.get('tags', [])
    new_post['status'] = "proposed"
    new_post['created'] = today
    new_post['workstream'] = post.get('workstream')

    roadmap_dir = PROJECT_ROOT / "runtime/roadmap"
    roadmap_dir.mkdir(exist_ok=True)
    new_filename = roadmap_dir / f"roadmap-from-loop-{loop_uuid[:8]}.md"
    
    with open(new_filename, 'wb') as f:
        frontmatter.dump(new_post, f)

    return {"status": "success", "file_path": str(new_filename)}


def suggest_roadmap_promotions(workstream_id: str, db_path="runtime/db/ora.db", top_n=2):
    """Scores loops in a workstream and promotes the top N to the roadmap."""
    conn = sqlite3.connect(db_path)
    
    try:
        loops_df = pd.read_sql(
            "SELECT uuid, title FROM loop_metadata WHERE workstream=? AND status IN ('active', 'pending')", 
            conn, 
            params=(workstream_id,)
        )
    except pd.io.sql.DatabaseError:
        conn.close()
        return {"error": f"Could not load loops for workstream '{workstream_id}'"}
    
    if loops_df.empty:
        conn.close()
        return {"promoted_items": [], "message": "No active loops to suggest from."}
    
    scores = []
    for index, row in loops_df.iterrows():
        loop_uuid, loop_title = row['uuid'], row['title']
        score = 0
        reasons = []

        # Score based on task repetition (high similarity to other tasks)
        similar_tasks = find_similar_tasks(loop_title, threshold=0.8)
        if isinstance(similar_tasks, list) and len(similar_tasks) > 1:
            score += len(similar_tasks)
            reasons.append(f"{len(similar_tasks)} similar tasks")

        # Score based on feedback signals
        feedback_df = pd.read_sql("SELECT tag FROM loop_feedback WHERE uuid=?", conn, params=(loop_uuid,))
        if feedback_df.empty:
            score += 2
            reasons.append("no feedback")
        else:
            useful = 'useful' in feedback_df['tag'].values
            false_positive = 'false_positive' in feedback_df['tag'].values
            if useful and false_positive:
                score += 3
                reasons.append("mixed feedback")
        
        if score > 0:
            scores.append({"uuid": loop_uuid, "title": loop_title, "score": score, "reasons": reasons})
    
    conn.close()
    
    sorted_suggestions = sorted(scores, key=lambda x: x['score'], reverse=True)
    top_suggestions = sorted_suggestions[:top_n]

    promoted_files = []
    for suggestion in top_suggestions:
        result = promote_loop_to_roadmap(suggestion['uuid'])
        if 'file_path' in result:
            promoted_files.append({
                "title": suggestion['title'],
                "file_path": result['file_path'],
                "reason": ", ".join(suggestion['reasons'])
            })
            
    return {"promoted_items": promoted_files} 