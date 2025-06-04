import yaml
from pathlib import Path
from collections import defaultdict
from typing import List, Dict, Any, Optional
from src.system.trust import checkpoint

# Assuming this file is in src/data/workstream_loader.py
project_root = Path(__file__).resolve().parent.parent.parent 
PLAN_PATH = project_root / "workstream_plan.yaml"
FEEDBACK_PATH = project_root / "feedback_scores.yaml"

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
    """Loads feedback scores, keyed by filename for easier lookup from plan items."""
    feedback_map: Dict[str, Dict[str, Any]] = {}
    if not FEEDBACK_PATH.exists():
        print(f"(Loader) Warning: Feedback scores file not found: {FEEDBACK_PATH}. No feedback will be merged.")
        return feedback_map
    
    try:
        raw_feedback_list = yaml.safe_load(FEEDBACK_PATH.read_text(encoding="utf-8"))
        if not isinstance(raw_feedback_list, list):
            print(f"(Loader) Warning: Feedback data in {FEEDBACK_PATH} is not a list. No feedback will be merged.")
            return feedback_map
        
        for entry in raw_feedback_list:
            if isinstance(entry, dict) and "filename" in entry and "uuid" in entry:
                feedback_map[entry["filename"]] = entry
            else:
                print(f"(Loader) Warning: Skipping invalid or incomplete feedback entry: {entry}")
        return feedback_map
        
    except yaml.YAMLError as e:
        print(f"(Loader) Error parsing YAML from feedback file {FEEDBACK_PATH}: {e}. No feedback will be merged.")
        return {}
    except Exception as e:
        print(f"(Loader) An unexpected error occurred loading feedback from {FEEDBACK_PATH}: {e}. No feedback will be merged.")
        return {}

def merge_plan_with_feedback(plan: List[Dict[str, Any]], feedback_by_filename: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Merges feedback scores into plan items based on the origin (filename)."""
    modified_plan = [item.copy() for item in plan] # Work on a copy to avoid modifying the original list in place directly
    for item in modified_plan:
        origin_filename = item.get("origin")
        if isinstance(origin_filename, str) and origin_filename in feedback_by_filename:
            feedback_entry = feedback_by_filename[origin_filename]
            if "score" in feedback_entry:
                item["feedback_score"] = feedback_entry["score"] 
        elif isinstance(origin_filename, str) and origin_filename.startswith("derived-from"):
            # Placeholder for special handling for derived items if needed
            pass 
    return modified_plan

def get_phase_summary(plan: List[Dict[str, Any]]) -> Dict[Any, List[Dict[str, Any]]]:
    """Groups plan items by phase."""
    phase_map: Dict[Any, List[Dict[str, Any]]] = defaultdict(list)
    for item in plan:
        phase = item.get("phase", "Unphased") # Default to "Unphased" if phase key is missing
        phase_map[phase].append(item)
    return phase_map

if __name__ == '__main__':
    print("Testing src.data.workstream_loader module...")
    
    # Create dummy workstream_plan.yaml for testing if it doesn't exist
    if not PLAN_PATH.exists():
        print(f"Creating dummy {PLAN_PATH} for testing loader.")
        dummy_plan_data = [
            {"id": "1.0", "title": "Task A", "origin": "loop_A.md", "phase": "Alpha", "status": "in_progress"},
            {"id": "1.1", "title": "Task B", "origin": "loop_B.md", "phase": "Alpha", "feedback_score": 0.5, "status": "complete"},
            {"id": "2.0", "title": "Task C", "origin": "loop_C.md", "phase": "Beta", "status": "todo"}
        ]
        PLAN_PATH.write_text(yaml.safe_dump(dummy_plan_data, indent=2), encoding="utf-8")

    # Create dummy feedback_scores.yaml for testing if it doesn't exist
    if not FEEDBACK_PATH.exists():
        print(f"Creating dummy {FEEDBACK_PATH} for testing loader.")
        dummy_feedback_data = [
            {"uuid": "uuid_A", "filename": "loop_A.md", "score": 1.5},
            {"uuid": "uuid_C", "filename": "loop_C.md", "score": -0.5}
        ]
        FEEDBACK_PATH.write_text(yaml.safe_dump(dummy_feedback_data, indent=2), encoding="utf-8")

    test_plan = load_plan()
    print(f"\nLoaded {len(test_plan)} plan items from {PLAN_PATH}.")
    if test_plan: print(f"First plan item: {test_plan[0]}")

    test_feedback = load_feedback()
    print(f"\nLoaded {len(test_feedback)} feedback entries from {FEEDBACK_PATH} (keyed by filename)." )
    if test_feedback: print(f"Feedback for loop_A.md: {test_feedback.get('loop_A.md')}")

    if test_plan:
        merged = merge_plan_with_feedback(test_plan, test_feedback)
        print("\nMerge complete.")
        if merged:
            print(f"First item after merge: {merged[0]}")

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
    feedback_data = load_feedback()
    print(f"Loaded {len(feedback_data)} feedback entries (keyed by filename).")

    if not plan_items:
        print("No plan items loaded. Exiting.")
    else:
        print("\nMerging feedback scores into plan...")
        merged_plan = merge_plan_with_feedback(plan_items, feedback_data)
        
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