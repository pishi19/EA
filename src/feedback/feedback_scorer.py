import yaml
from pathlib import Path
from typing import List, Dict, Any # Added for type hinting
from datetime import datetime # For dummy file creation in __main__

# Determine project root assuming this script is in src/feedback/feedback_scorer.py
project_root = Path(__file__).resolve().parent.parent.parent
LOOP_DIR = project_root / "runtime/loops"
OUTPUT_FILE = project_root / "feedback_scores.yaml"

TAG_WEIGHTS: Dict[str, float] = {
    "#useful": 1.0,
    "#false_positive": -1.0,
    "#confusing": -0.5,
    "#insightful": 1.5
}

def score_feedback_from_loops() -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []

    if not LOOP_DIR.is_dir():
        print(f"Warning: Loop directory not found: {LOOP_DIR}")
        return results

    for path in LOOP_DIR.glob("*.md"):
        try:
            raw_content = path.read_text(encoding="utf-8")
            parts = raw_content.split("---", 2)
            if len(parts) < 3:
                print(f"Warning: Malformed file (no valid frontmatter section): {path.name}")
                continue
            
            frontmatter = yaml.safe_load(parts[1])
            if not isinstance(frontmatter, dict):
                print(f"Warning: Frontmatter in {path.name} is not a dictionary. Skipping.")
                frontmatter = {} # Ensure frontmatter is a dict to avoid errors on .get
                # Or skip this file if frontmatter is critical and invalid:
                # continue 

        except yaml.YAMLError as e:
            print(f"Error parsing YAML frontmatter in {path.name}: {e}. Skipping.")
            continue
        except FileNotFoundError:
            print(f"Error: File not found during processing (should not happen if glob succeeded): {path.name}")
            continue
        except Exception as e:
            print(f"An unexpected error occurred reading/parsing {path.name}: {e}. Skipping.")
            continue

        raw_feedback_tags = frontmatter.get("feedback_tags")
        feedback_tags_list: List[str] = []
        if isinstance(raw_feedback_tags, list):
            feedback_tags_list = [str(tag) for tag in raw_feedback_tags if isinstance(tag, (str, int, float))] # Ensure tags are strings
        elif raw_feedback_tags is not None:
            print(f"Warning: feedback_tags in {path.name} is not a list (found {type(raw_feedback_tags)}), treating as empty.")

        uuid = frontmatter.get("uuid")
        if not uuid:
            print(f"Warning: No UUID found in {path.name}. Recording score without UUID association if tags exist.")
            # Allow scoring even if UUID is missing, but log it.

        current_score = sum(TAG_WEIGHTS.get(tag, 0.0) for tag in feedback_tags_list)

        results.append({
            "uuid": str(uuid) if uuid else None, # Ensure UUID is string or None
            "score": round(current_score, 2),
            "filename": path.name, # Store just the filename for brevity
            "project": frontmatter.get("project"),
            "phase": frontmatter.get("phase"),
            "feedback_tags": feedback_tags_list # Store the processed list of tags
        })

    return results

if __name__ == "__main__":
    print(f"Scoring feedback from loops in: {LOOP_DIR}")

    # Create dummy files for testing if no suitable files are present
    if not LOOP_DIR.exists():
        LOOP_DIR.mkdir(parents=True, exist_ok=True)
        print(f"Created loop directory: {LOOP_DIR}")

    # Check if any .md files with feedback_tags exist, otherwise create dummies
    create_dummies = True
    if any(LOOP_DIR.glob("*.md")):
        create_dummies = False # Assume files might exist, specific check later if needed or rely on output
        # A more thorough check could parse all existing files first, but for simplicity:
        # If any .md exists, we assume it might be a test case.
        # The script will report if they lack UUIDs or feedback_tags.

    if create_dummies or not any(LOOP_DIR.glob("*.md")):
        print("Creating dummy loop files for testing feedback scoring...")
        dummy_files_data = [
            {
                "name": "dummy_loop_useful.md", 
                "uuid": "d1f8f9c6-1a7b-4b3c-8e6a-3c8a5b9e0d1f",
                "feedback_tags": ["#useful", "#insightful"], 
                "content": "This is a very useful loop."
            },
            {
                "name": "dummy_loop_negative.md", 
                "uuid": "e2g9f8d5-2b8c-5c4d-9f7b-4d9b6c0f1e2g",
                "feedback_tags": ["#false_positive", "#confusing"], 
                "content": "This loop was confusing and a false positive."
            },
            {
                "name": "dummy_loop_no_feedback.md", 
                "uuid": "f3h0g7e4-3c9d-6d5e-0g8c-5e0c7d1g2f3h",
                "feedback_tags": [], 
                "content": "This loop has no specific feedback tags yet."
            },
            {
                "name": "dummy_loop_mixed.md", 
                "uuid": "g4i1h6f3-4d0e-7e6f-1h9d-6f1d8e2h3g4i",
                "feedback_tags": ["#useful", "#confusing"], 
                "content": "This loop was useful but also a bit confusing."
            }
        ]
        for item_data in dummy_files_data:
            file_path = LOOP_DIR / item_data["name"]
            frontmatter = {
                "uuid": item_data["uuid"],
                "feedback_tags": item_data["feedback_tags"],
                "project": "Test Project",
                "phase": "X.Y",
                "created": datetime.now().isoformat()
            }
            file_content = f"---\n{yaml.safe_dump(frontmatter).strip()}\n---\n\n{item_data['content']}"
            try:
                file_path.write_text(file_content, encoding="utf-8")
                print(f"Created dummy file: {file_path.name}")
            except Exception as e:
                print(f"Error creating dummy file {file_path.name}: {e}")

    scored_results = score_feedback_from_loops()

    if scored_results:
        print(f"\nScored {len(scored_results)} loop files.")
        # Print a few results as a sample
        for i, res in enumerate(scored_results[:3]):
            print(f"  Sample {i+1}: File: {res['filename']}, UUID: {res['uuid']}, Score: {res['score']}, Tags: {res['feedback_tags']}")
        if len(scored_results) > 3:
            print("  ...")
        
        try:
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                yaml.safe_dump(scored_results, f, sort_keys=False, indent=2)
            print(f"\n✅ Feedback scores saved to: {OUTPUT_FILE}")
        except Exception as e:
            print(f"\n❌ Error saving feedback scores to {OUTPUT_FILE}: {e}")
    else:
        print("\nNo loop files were scored. Ensure *.md files with frontmatter exist in the loop directory.") 