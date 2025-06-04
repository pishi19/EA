import yaml
from pathlib import Path
from src.data.workstream_loader import load_plan, load_feedback, merge_plan_with_feedback
from typing import List, Dict, Any # Added for type hinting

# Assuming this file is in src/planning/apply_feedback_to_plan.py
project_root = Path(__file__).resolve().parent.parent.parent 
PLAN_PATH = project_root / "workstream_plan.yaml" # Made project-root relative

def save_plan(plan: List[Dict[str, Any]]):
    """Saves the updated plan to the YAML file."""
    try:
        PLAN_PATH.write_text(yaml.safe_dump(plan, sort_keys=False, indent=2), encoding="utf-8")
        print(f"✅ Updated plan with feedback scores written to: {PLAN_PATH}")
    except Exception as e:
        print(f"❌ Error saving updated plan to {PLAN_PATH}: {e}")

def main():
    print(f"Starting plan update process...")
    print(f"Loading plan from: {PLAN_PATH}")
    plan = load_plan()
    
    if not plan:
        # load_plan() already prints warnings if file not found or empty/invalid.
        print("No plan items loaded or plan file is empty/invalid. Exiting update process.")
        return
    print(f"Loaded {len(plan)} plan items.")

    print("\nLoading feedback scores...")
    feedback = load_feedback()
    # load_feedback() prints warnings if file not found or empty/invalid.
    if not feedback:
        print("No feedback data loaded. Plan will be saved without new feedback scores.")
    else:
        print(f"Loaded {len(feedback)} feedback entries (keyed by filename).")

    print("\nMerging feedback into plan...")
    # merge_plan_with_feedback is expected to return a new list or modified copy
    merged_plan = merge_plan_with_feedback(plan, feedback)
    print("Merge process complete.")
    
    print("\nSaving updated plan...")
    save_plan(merged_plan)

if __name__ == "__main__":
    # Create dummy workstream_plan.yaml for testing if it doesn't exist
    if not PLAN_PATH.exists():
        print(f"Creating dummy {PLAN_PATH} for testing apply_feedback_to_plan script.")
        dummy_plan_data = [
            {"id": "1.0", "title": "Task A", "origin": "loop_A.md", "phase": "Alpha"},
            {"id": "1.1", "title": "Task B", "origin": "loop_B.md", "phase": "Alpha", "feedback_score": 0.5},
            {"id": "1.2", "title": "Task C - No Feedback Expected", "origin": "loop_X.md", "phase": "Beta"}

        ]
        PLAN_PATH.write_text(yaml.safe_dump(dummy_plan_data, indent=2), encoding="utf-8")

    # Create dummy feedback_scores.yaml for testing if it doesn't exist
    # This should match the FEEDBACK_PATH in workstream_loader.py
    feedback_loader_feedback_path = project_root / "feedback_scores.yaml"
    if not feedback_loader_feedback_path.exists():
        print(f"Creating dummy {feedback_loader_feedback_path} for testing apply_feedback_to_plan script.")
        dummy_feedback_data = [
            {"uuid": "uuid_A", "filename": "loop_A.md", "score": 2.5, "project": "P1", "phase": "A"},
            {"uuid": "uuid_B", "filename": "loop_B.md", "score": -0.5, "project": "P1", "phase": "A"} # Will update existing score
        ]
        feedback_loader_feedback_path.write_text(yaml.safe_dump(dummy_feedback_data, indent=2), encoding="utf-8")

    main() 