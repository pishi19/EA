import os
import sqlite3
import sys
from pathlib import Path

import frontmatter

# Add project root to path to allow importing from src
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(PROJECT_ROOT))

from src.agent.commands.promote_loop import promote_loop_to_roadmap


def find_promotable_loops(
    roadmap_dir=None,
    db_path=None,
    loops_dir=None,
):
    """
    Finds loops that are eligible for promotion.
    This is the proven logic from our standalone tests.
    """
    if roadmap_dir is None:
        roadmap_dir = PROJECT_ROOT / "runtime/roadmap"
    if db_path is None:
        db_path = PROJECT_ROOT / "runtime/db/ora.db"
    if loops_dir is None:
        loops_dir = PROJECT_ROOT / "runtime/loops"

    promoted_uuids = set()
    if roadmap_dir.exists():
        for fname in os.listdir(roadmap_dir):
            if fname.endswith(".md"):
                try:
                    post = frontmatter.load(roadmap_dir / fname)
                    if "origin_loop" in post:
                        promoted_uuids.add(post["origin_loop"])
                except Exception:
                    continue

    all_db_loops = []
    if db_path.exists():
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT uuid, title, workstream FROM loop_metadata WHERE workstream IS NOT NULL")
        rows = cur.fetchall()
        conn.close()
        all_db_loops = [{"uuid": r[0], "title": r[1], "workstream": r[2]} for r in rows]

    db_loops_with_files = set()
    if loops_dir.exists():
        all_loop_files_by_uuid = {}
        for fname in os.listdir(loops_dir):
            if fname.endswith(".md"):
                try:
                    post = frontmatter.load(loops_dir / fname)
                    if "uuid" in post:
                        all_loop_files_by_uuid[post["uuid"]] = fname
                except Exception:
                    continue
        for loop_data in all_db_loops:
            if loop_data["uuid"] in all_loop_files_by_uuid:
                db_loops_with_files.add(loop_data["uuid"])

    final_list = [
        loop for loop in all_db_loops
        if loop["uuid"] in db_loops_with_files and loop["uuid"] not in promoted_uuids
    ]
    return final_list

def main():
    """
    An interactive command-line tool to promote loops to the roadmap.
    """
    print("--- 🔁 Loop Promotion Tool ---")
    promotable = find_promotable_loops()

    if not promotable:
        print("✅ No promotable loops found.")
        return

    print("The following loops are ready for promotion:")
    for i, loop in enumerate(promotable):
        print(f"  [{i+1}] {loop['title']} (Workstream: {loop['workstream']})")

    while True:
        try:
            choice = input("\nEnter the number of the loop to promote (or 'q' to quit): ")
            if choice.lower() == 'q':
                break

            choice_index = int(choice) - 1
            if 0 <= choice_index < len(promotable):
                loop_to_promote = promotable[choice_index]
                uuid = loop_to_promote['uuid']
                print(f"\n🚀 Promoting '{loop_to_promote['title']}'...")
                result = promote_loop_to_roadmap(uuid)
                if result.get("status") == "success":
                    print(f"✅ Success! Created roadmap file: {result['file_path']}")
                else:
                    print(f"❌ Error: {result.get('error')}")
                break
            else:
                print("Invalid number. Please try again.")
        except ValueError:
            print("Invalid input. Please enter a number or 'q'.")
        except (KeyboardInterrupt, EOFError):
            break

    print("\nExiting promotion tool.")

if __name__ == "__main__":
    main()
