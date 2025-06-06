import json
import logging
import sqlite3
from collections import Counter
from pathlib import Path

import yaml

# --- Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "runtime/db/feedback.db"
LOOP_DIR = PROJECT_ROOT / "runtime/loops"
FEEDBACK_TAG_SCORES = {
    "#useful": 3,
    "#false_positive": -2,
    "#needs_context": -1,
}

# --- Database Setup ---
def setup_database(conn: sqlite3.Connection):
    """Ensures the necessary tables exist in the database."""
    cursor = conn.cursor()

    # Table for individual feedback events
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS loop_feedback (
        uuid TEXT NOT NULL,
        tag TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (uuid, tag)
    )
    """)

    # Table for aggregated scores per loop
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS loop_scores (
        uuid TEXT PRIMARY KEY,
        score INTEGER NOT NULL,
        tag_counts TEXT NOT NULL
    )
    """)

    conn.commit()
    logging.info("Database tables verified and ready.")

# --- File Parsing ---
def parse_frontmatter(file_path: Path) -> dict | None:
    """Parses YAML frontmatter from a Markdown file, returning None on error."""
    try:
        with open(file_path, encoding="utf-8") as f:
            content = f.read()
        if not content.startswith("---"):
            return None
        parts = content.split("---", 2)
        if len(parts) < 3:
            return None
        frontmatter = yaml.safe_load(parts[1])
        return frontmatter if isinstance(frontmatter, dict) else None
    except Exception as e:
        logging.error(f"Error parsing frontmatter for {file_path.name}: {e}")
        return None

# --- Main Sync Logic ---
def sync_feedback_to_db():
    """Scans loops, processes feedback tags, and syncs results to the SQLite DB."""
    logging.info("Starting feedback sync to SQLite...")

    # Ensure database directory exists
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    setup_database(conn)

    cursor = conn.cursor()

    # Full resync: clear existing data to prevent stale entries
    cursor.execute("DELETE FROM loop_feedback")
    cursor.execute("DELETE FROM loop_scores")
    logging.info("Cleared existing feedback data for a full resync.")

    # Counters for summary
    stats = Counter()

    all_loop_files = list(LOOP_DIR.glob("loop-*.md"))
    stats['loops_scanned'] = len(all_loop_files)

    for file_path in all_loop_files:
        frontmatter = parse_frontmatter(file_path)
        if not (frontmatter and frontmatter.get("uuid") and "tags" in frontmatter):
            logging.warning(f"Skipping {file_path.name}: missing uuid or tags.")
            continue

        uuid = str(frontmatter["uuid"]).strip()
        tags = frontmatter.get("tags", [])
        if not isinstance(tags, list):
            continue

        feedback_tags_found = [tag for tag in tags if tag in FEEDBACK_TAG_SCORES]
        if not feedback_tags_found:
            continue

        stats['loops_with_feedback'] += 1
        current_score = 0
        tag_counts = Counter()

        # Process each feedback tag
        for tag_str in feedback_tags_found:
            tag_name = tag_str.lstrip('#')
            current_score += FEEDBACK_TAG_SCORES[tag_str]
            tag_counts[tag_name] += 1

            # Insert individual tag record
            try:
                cursor.execute(
                    "INSERT OR IGNORE INTO loop_feedback (uuid, tag) VALUES (?, ?)",
                    (uuid, tag_name)
                )
                if cursor.rowcount > 0:
                    stats['feedback_entries_inserted'] += 1
            except sqlite3.Error as e:
                logging.error(f"Failed to insert into loop_feedback for UUID {uuid}: {e}")


        # Upsert the aggregated score
        try:
            tag_counts_json = json.dumps(dict(tag_counts))
            cursor.execute(
                """
                INSERT INTO loop_scores (uuid, score, tag_counts)
                VALUES (?, ?, ?)
                ON CONFLICT(uuid) DO UPDATE SET
                    score = excluded.score,
                    tag_counts = excluded.tag_counts
                """,
                (uuid, current_score, tag_counts_json)
            )
            stats['scores_synced'] += 1
        except sqlite3.Error as e:
            logging.error(f"Failed to upsert into loop_scores for UUID {uuid}: {e}")

    conn.commit()
    conn.close()

    logging.info("--- Sync Summary ---")
    logging.info(f"Total loops scanned: {stats['loops_scanned']}")
    logging.info(f"Loops with feedback tags: {stats['loops_with_feedback']}")
    logging.info(f"Individual feedback entries synced: {stats['feedback_entries_inserted']}")
    logging.info(f"Aggregated scores synced: {stats['scores_synced']}")
    logging.info("--------------------")
    logging.info("Feedback sync to SQLite finished successfully.")

if __name__ == "__main__":
    sync_feedback_to_db()
