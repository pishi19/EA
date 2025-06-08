import sqlite3
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List

import yaml

from src.system.trust import checkpoint

# Assuming this file is in src/data/workstream_loader.py
project_root = Path(__file__).resolve().parent.parent.parent
PLAN_PATH = project_root / "workstream_plan.yaml"
FEEDBACK_PATH = project_root / "src/data/feedback_scores.yaml"

@checkpoint(tag='loader-update')
def load_plan() -> List[Dict[str, Any]]:
    """Loads the workstream plan from YAML file."""
    try:
        if not PLAN_PATH.exists():
            print(f"(Loader) Warning: Plan file not found: {PLAN_PATH}. Returning empty plan.")
            return []
        plan_data = yaml.safe_load(PLAN_PATH.read_text(encoding="utf-8"))
        if isinstance(plan_data, list):
            return plan_data
        elif plan_data is None: # Handles empty file case
            return []
        else:
            print(f"(Loader) Warning: Plan data in {PLAN_PATH} is not a list. Returning empty plan.")
            return []
    except yaml.YAMLError as e:
        print(f"(Loader) Error parsing YAML from plan file {PLAN_PATH}: {e}. Returning empty plan.")
        return []
    except Exception as e:
        print(f"(Loader) An unexpected error occurred loading plan from {PLAN_PATH}: {e}. Returning empty plan.")
        return []

def load_feedback() -> Dict[str, Dict[str, Any]]:
    """Loads feedback scores from YAML, expected to be keyed by UUID."""
    feedback_by_uuid: Dict[str, Dict[str, Any]] = {}
    if not FEEDBACK_PATH.exists():
        print(f"(Loader) Warning: Feedback scores file not found: {FEEDBACK_PATH}. No feedback will be merged.")
        return feedback_by_uuid

    try:
        loaded_data = yaml.safe_load(FEEDBACK_PATH.read_text(encoding="utf-8"))

        if isinstance(loaded_data, dict):
            # Basic validation: ensure keys are strings (UUIDs) and values are dicts with 'score'
            valid_data = True
            for key, value in loaded_data.items():
                if not (isinstance(key, str) and isinstance(value, dict) and "score" in value):
                    valid_data = False
                    print(f"(Loader) Warning: Invalid entry in {FEEDBACK_PATH} for key '{key}'. Expected string UUID key and dict value with 'score'.")
                    break
            if valid_data:
                feedback_by_uuid = loaded_data
                print(f"(Loader) Successfully loaded feedback scores for {len(feedback_by_uuid)} UUIDs from {FEEDBACK_PATH}.")
            else:
                print(f"(Loader) Warning: Some data in {FEEDBACK_PATH} is not in the expected format. No feedback will be merged.")
                return {} # Return empty if structure is partially incorrect

        elif loaded_data is None: # Handles empty file case
            print(f"(Loader) Feedback scores file {FEEDBACK_PATH} is empty. No feedback will be merged.")
            # feedback_by_uuid is already {}
        else: # Unexpected format (e.g., a list or other type)
            print(f"(Loader) Warning: Feedback data in {FEEDBACK_PATH} is not in the expected dictionary format (keyed by UUID). Expected dict, got {type(loaded_data)}. No feedback will be merged.")
            # feedback_by_uuid is already {}

        return feedback_by_uuid

    except yaml.YAMLError as e:
        print(f"(Loader) Error parsing YAML from feedback file {FEEDBACK_PATH}: {e}. No feedback will be merged.")
        return {}
    except Exception as e:
        print(f"(Loader) An unexpected error occurred loading feedback from {FEEDBACK_PATH}: {e}. No feedback will be merged.")
        return {}

def merge_plan_with_feedback(plan: List[Dict[str, Any]], feedback_by_uuid: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Merges feedback scores into plan items based on UUID, ensuring all items get a score (defaulting to 0)."""
    modified_plan = [item.copy() for item in plan]
    for item in modified_plan:
        item_uuid = item.get("uuid")

        # Determine feedback score based on UUID presence and content in feedback_by_uuid
        if isinstance(item_uuid, str) and item_uuid: # Check for valid, non-empty string UUID
            # Use .get(item_uuid, {}) to handle UUIDs not in feedback_by_uuid, then .get("score", 0) for missing scores
            item["feedback_score"] = feedback_by_uuid.get(item_uuid, {}).get("score", 0)
        else: # UUID is not a string, is empty, or is None
            item["feedback_score"] = 0 # Default score for items without a valid UUID

        # Handle feedback_tags: only add/update if UUID is valid, found in feedback_by_uuid, and has a "tags" entry
        if isinstance(item_uuid, str) and item_uuid in feedback_by_uuid:
            feedback_entry = feedback_by_uuid[item_uuid] # UUID is confirmed to be in feedback_by_uuid
            if "tags" in feedback_entry:
                item["feedback_tags"] = feedback_entry["tags"]
        # If UUID is not valid, or not in feedback_by_uuid, or feedback_entry has no tags,
        # item["feedback_tags"] from the original item copy remains untouched.
        # If it didn't exist, it won't be added. If it did, it will persist unless overwritten above.

    return modified_plan

def get_phase_summary(plan: List[Dict[str, Any]]) -> Dict[Any, List[Dict[str, Any]]]:
    """Groups plan items by phase."""
    phase_map: Dict[Any, List[Dict[str, Any]]] = defaultdict(list)
    for item in plan:
        phase = item.get("phase", "Unphased") # Default to "Unphased" if phase key is missing
        phase_map[phase].append(item)
    return phase_map

def load_workstreams(db_path="runtime/db/ora.db"):
    conn = sqlite3.connect(db_path)
    # Use a row factory for dictionary-like access
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT id, title, tags, goals, owners FROM workstreams")
    rows = cur.fetchall()
    conn.close()

    return [
        {
            "id": row["id"],
            "title": row["title"],
            "tags": row["tags"].split(",") if row["tags"] else [],
            "goals": row["goals"].split(", ") if row["goals"] else [], # Assuming goals are comma-separated
            "owners": row["owners"].split(",") if row["owners"] else []
        }
        for row in rows
    ]

if __name__ == '__main__':
    print("Testing src.data.workstream_loader module...")

    # Create dummy workstream_plan.yaml for testing if it doesn't exist
    if not PLAN_PATH.exists():
        print(f"Creating dummy {PLAN_PATH} for testing loader.")
        dummy_plan_data = [
            {"id": "1.0", "uuid": "uuid_A", "title": "Task A", "origin": "loop_A.md", "phase": "Alpha", "status": "in_progress"},
            {"id": "1.1", "uuid": "uuid_B", "title": "Task B", "origin": "loop_B.md", "phase": "Alpha", "feedback_score": 0.5, "status": "complete"},
            {"id": "2.0", "uuid": "uuid_C", "title": "Task C", "origin": "loop_C.md", "phase": "Beta", "status": "todo"}
        ]
        PLAN_PATH.write_text(yaml.safe_dump(dummy_plan_data, indent=2), encoding="utf-8")

    # Create dummy feedback_scores.yaml for testing if it doesn't exist (keyed by UUID)
    if not FEEDBACK_PATH.exists():
        print(f"Creating dummy {FEEDBACK_PATH} for testing loader (keyed by UUID).")
        dummy_feedback_data_uuid_keyed = {
            "uuid_A": {"score": 3, "tags": ["useful"]},
            "uuid_C": {"score": -2, "tags": ["false_positive"]},
            "uuid_D_not_in_plan": {"score": 1, "tags": ["needs_context"]}
        }
        FEEDBACK_PATH.write_text(yaml.safe_dump(dummy_feedback_data_uuid_keyed, indent=2), encoding="utf-8")

    test_plan = load_plan()
    print(f"\nLoaded {len(test_plan)} plan items from {PLAN_PATH}.")
    if test_plan: print(f"First plan item: {test_plan[0]}")

    test_feedback_uuid_keyed = load_feedback()
    print(f"\nLoaded {len(test_feedback_uuid_keyed)} feedback entries from {FEEDBACK_PATH} (keyed by UUID)." )
    if test_feedback_uuid_keyed.get("uuid_A"):
        print(f"Feedback for uuid_A: {test_feedback_uuid_keyed.get('uuid_A')}")

    if test_plan:
        merged = merge_plan_with_feedback(test_plan, test_feedback_uuid_keyed)
        print("\nMerge complete using UUIDs.")
        if merged:
            print(f"First item after merge: {merged[0]}")
            # Example: Check if feedback_score was merged for uuid_A
            item_A_merged = next((item for item in merged if item.get("uuid") == "uuid_A"), None)
            if item_A_merged:
                print(f"Item A ('{item_A_merged.get('title')}') after merge: {item_A_merged}")

        summary = get_phase_summary(merged)
        print("\nPhase summary generated:")
        for phase_key, phase_items in summary.items():
            print(f"  Phase {phase_key}: {len(phase_items)} items")
            if phase_items:
                print(f"    First item in phase {phase_key}: {phase_items[0].get('title')}")

    print(f"\nLoading plan from: {PLAN_PATH}")
    plan_items = load_plan()
    print(f"Loaded {len(plan_items)} plan items.")

    print(f"\nLoading feedback scores from: {FEEDBACK_PATH}")
    feedback_data_uuid_keyed = load_feedback()
    print(f"Loaded {len(feedback_data_uuid_keyed)} feedback entries (keyed by UUID).")

    if not plan_items:
        print("No plan items loaded. Exiting.")
    else:
        print("\nMerging feedback scores into plan...")
        merged_plan = merge_plan_with_feedback(plan_items, feedback_data_uuid_keyed)

        print("\nGenerating phase summary...")
        phase_summary = get_phase_summary(merged_plan)

        print("\n--- Workstream Plan Summary by Phase ---")
        # Sort phases for consistent output, handling potential non-string phase IDs gracefully
        sorted_phases = sorted(phase_summary.keys(), key=lambda x: str(x))

        for phase in sorted_phases:
            items = phase_summary[phase]
            print(f"\n📌 Phase {phase}: {len(items)} item(s)")
            for item in items:
                title = item.get('title', 'No Title')
                status = item.get('status', 'N/A')
                score = item.get('feedback_score')
                score_str = f"score={score}" if score is not None else "score=N/A"
                effort = item.get('effort')
                effort_str = f"effort={effort}" if effort is not None else ""
                priority = item.get('priority')
                priority_str = f"priority={priority}" if priority is not None else ""

                details = f"({score_str}"
                if effort_str: details += f", {effort_str}"
                if priority_str: details += f", {priority_str}"
                details += ")"

                print(f"  - [{status}] {title} {details}")
        print("\n--- End of Summary ---")

        # Optionally, save the merged plan back to a new file or overwrite
        # output_merged_plan_path = project_root / "workstream_plan_with_feedback.yaml"
        # print(f"\nSaving merged plan to: {output_merged_plan_path}")
        # try:
        #     with open(output_merged_plan_path, 'w', encoding='utf-8') as f:
        #         yaml.safe_dump(merged_plan, f, sort_keys=False, indent=2)
        #     print(f"✅ Merged plan saved successfully.")
        # except Exception as e:
        #     print(f"❌ Error saving merged plan: {e}")
