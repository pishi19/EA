import yaml
from pathlib import Path
from typing import Dict, List, Any # Added for type hinting

from src.qdrant.query import find_nearest_project_match  # fallback via Qdrant

# For example usage (if __name__ == "__main__"):
from datetime import datetime # Keep for __main__ if it uses it
from src.signals.collector import Signal # Keep for __main__
from src.loops.loop_creator import create_loop_from_signal, LOOP_DIR as creator_loop_dir # Keep for __main__

TAG_PROJECT_MAP: Dict[str, str] = {
    "#ora": "Ora Executive Assistant",
    "@project/ora": "Ora Executive Assistant",
}

PHASE_TAGS: Dict[str, str] = {
    "#phase-5": "5",
    "#phase-5.1": "5.1",
}

def extract_tags(text: str) -> List[str]:
    return [word for word in text.split() if word.startswith("#") or word.startswith("@")]

# Updated function definition: find_nearest_match_func argument removed
def route_loop_to_project(loop_path: Path) -> Dict[str, Any]:
    raw = loop_path.read_text(encoding="utf-8")
    # Split only on the first two --- to correctly separate frontmatter, ---, and body
    parts = raw.split("---", 2)
    if len(parts) < 3:
        raise ValueError(f"Malformed loop file (could not split frontmatter and body): {loop_path}")
    
    try:
        frontmatter = yaml.safe_load(parts[1])
        if not isinstance(frontmatter, dict):
            # Handle cases where frontmatter is not a dict (e.g. empty or just a string)
            print(f"Warning: Frontmatter in {loop_path} is not a dictionary. Initializing empty frontmatter.")
            frontmatter = {}
    except yaml.YAMLError as e:
        raise ValueError(f"Invalid YAML frontmatter in {loop_path}: {e}")
    
    body = parts[2].strip() # Ensure body is stripped here
    
    # Extract tags from the main body content first
    body_tags = extract_tags(body)
    project = None
    phase = None
    
    # Combine body_tags with tags from frontmatter (if they exist and are a list)
    all_tags_for_routing = set(body_tags)
    if "tags" in frontmatter and isinstance(frontmatter["tags"], list):
        all_tags_for_routing.update(tag for tag in frontmatter["tags"] if isinstance(tag, str))

    for tag in all_tags_for_routing:
        if tag in TAG_PROJECT_MAP:
            project = TAG_PROJECT_MAP[tag]
        if tag in PHASE_TAGS:
            phase = PHASE_TAGS[tag]

    score = 0.0 # Default score

    # Fallback to embedding if tags not found
    if not project or not phase:
        # Directly call the imported find_nearest_project_match
        vector_result = find_nearest_project_match(body) 
        project = project or vector_result.get("project")
        phase = phase or vector_result.get("phase")
        score = vector_result.get("score", 0.0)
        if vector_result.get("error"):
            print(f"Warning: Embedding fallback for {loop_path.name} encountered an error: {vector_result.get('error')}")
    elif project and phase: # If tags provided both, score is 1.0
        score = 1.0
    # If only one is provided by tags, and the other is found by embedding, score might be adjusted.
    # Current logic uses the embedding score if embedding is called.
    # If one is from tag and other from embedding, what should score be? Let's use embedding score or 0.75 if tag helped.
    elif (project and not phase) or (not project and phase): # One found by tag, other might be found by embedding (already handled by above block)
        # This case is implicitly handled by the logic above.
        # If, for instance, project was found by tag, but phase was not,
        # the (not project or not phase) condition is true, embedding is called.
        # project remains set, phase gets updated from embedding, score is from embedding.
        # We could argue for a higher base score if a tag match contributed.
        if project or phase: # At least one was found by a tag initially
             score = max(score, 0.75) # Boost score if a tag contributed something

    # Update YAML
    frontmatter.update({
        "project": project,
        "phase": phase,
        "routed": True,
        "score": round(score, 3)
    })

    # Reconstruct content ensuring body is stripped once at the end
    # new_content = f"---\n{yaml.safe_dump(frontmatter).strip()}\n---\n\n{body}"
    # Simplified construction to avoid potential EOL in complex f-string with newlines
    frontmatter_str = yaml.safe_dump(frontmatter).strip()
    new_content = f"---\n{frontmatter_str}\n---\n\n{body}" # Reverted to f-string as it should be fine, EOL likely elsewhere
    loop_path.write_text(new_content, encoding="utf-8")

    return frontmatter

# --- Example Usage ---
# This mock function is now specific to this __main__ block for testing the router's logic flow
# without hitting the real Qdrant if we were to call route_loop_to_project directly here.
# However, with the new route_loop_to_project always calling the real one, this mock
# is somewhat orphaned unless we re-introduce a way to pass a match_func.
# For now, if __name__ == "__main__" runs, it will attempt real Qdrant calls.

def local_mock_find_nearest_project_match(text_content: str) -> Dict[str, Any]:
    """Mock function specific to __main__ if we wanted to test routing logic internally without real Qdrant."""
    print(f"LOCAL MOCK embedding search for: '{text_content[:50]}...'")
    if "database migration" in text_content.lower():
        return {"project": "Data Platform Initiative", "phase": "2.1", "score": 0.85}
    elif "onboarding" in text_content.lower():
        return {"project": "New Hire Success", "phase": "1.0", "score": 0.78}
    return {"project": "General Tasks (Local Mock)", "phase": "1.0 (Mock)", "score": 0.65}


if __name__ == "__main__":
    print(f"Loop files will be created in/read from: {creator_loop_dir.resolve()}")
    print("NOTE: This __main__ block will now attempt to use the REAL Qdrant connection.")
    print("Ensure Qdrant is running and OPENAI_API_KEY is set.")

    # To test purely routing logic with a mock, you'd need to temporarily modify 
    # route_loop_to_project to accept a function or call a local mock directly.

    # Test Case 1: Loop with explicit tags in content
    signal_with_tags = Signal(
        content="This loop is for #ora and specifically targets #phase-5.1 of the project.",
        source="test_router_explicit_tags",
        timestamp=datetime.now(),
        tags=[] 
    )
    loop_path_with_tags = create_loop_from_signal(signal_with_tags)
    print(f"\nCreated test loop (with tags): {loop_path_with_tags.name}")
    
    try:
        print("Routing loop with explicit tags (real Qdrant attempt)...")
        updated_frontmatter_1 = route_loop_to_project(loop_path_with_tags) # No match_func argument
        print(f"Updated frontmatter (with tags): {updated_frontmatter_1}")
        print(f"Full content (with tags):\n{loop_path_with_tags.read_text(encoding='utf-8')}")
    except Exception as e:
        print(f"Error during Test Case 1: {e}")
        traceback.print_exc()

    # Test Case 2: Loop without explicit project/phase tags (relies on fallback)
    signal_for_fallback = Signal(
        content="This loop discusses a critical database migration strategy and its implications.",
        source="test_router_fallback",
        timestamp=datetime.now(),
        tags=["#urgent"] 
    )
    loop_path_fallback = create_loop_from_signal(signal_for_fallback)
    print(f"\nCreated test loop (for fallback): {loop_path_fallback.name}")

    try:
        print("Routing loop for fallback (real Qdrant attempt)...")
        updated_frontmatter_2 = route_loop_to_project(loop_path_fallback) # No match_func argument
        print(f"Updated frontmatter (fallback): {updated_frontmatter_2}")
        print(f"Full content (fallback):\n{loop_path_fallback.read_text(encoding='utf-8')}")
    except Exception as e:
        print(f"Error during Test Case 2: {e}")
        traceback.print_exc()

    # Test Case 3: Loop with only a project tag
    signal_project_only = Signal(
        content="This task is related to @project/ora but the phase is not specified here.",
        source="test_router_project_tag_only",
        timestamp=datetime.now(),
        tags=[]
    )
    loop_path_project_only = create_loop_from_signal(signal_project_only)
    print(f"\nCreated test loop (project tag only): {loop_path_project_only.name}")
    try:
        print("Routing loop with project tag only (real Qdrant attempt)...")
        updated_frontmatter_3 = route_loop_to_project(loop_path_project_only) # No match_func argument
        print(f"Updated frontmatter (project tag only): {updated_frontmatter_3}")
        print(f"Full content (project tag only):\n{loop_path_project_only.read_text(encoding='utf-8')}")
    except Exception as e:
        print(f"Error during Test Case 3: {e}")
        traceback.print_exc() 