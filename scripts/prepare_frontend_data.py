import json
import re
from pathlib import Path
import yaml
import frontmatter

# --- Configuration ---
PROJECT_ROOT = Path(__file__).resolve().parents[1]
LOOPS_DIR = PROJECT_ROOT / "runtime/loops"
OUTPUT_DIR = PROJECT_ROOT / "src/ui/react-app/data"
OUTPUT_FILE = OUTPUT_DIR / "tasks.json"

# Regex to find tasks within a "Tasks" section
TASK_SECTION_PATTERN = re.compile(r"##\s*🛠\s*Tasks\s*([\s\S]*)", re.IGNORECASE)
CHECKLIST_ITEM_PATTERN = re.compile(r"-\s*\[(\s|x)\]\s*(.*)", re.IGNORECASE)

def parse_tasks_from_content(content):
    """
    Parses a markdown string to find checklist items within the 'Tasks' section.
    Returns a list of tuples: (is_checked, task_description).
    """
    task_section_match = TASK_SECTION_PATTERN.search(content)
    if not task_section_match:
        return []
        
    task_section_content = task_section_match.group(1)
    # Further limit to the content before the next section
    next_section_match = re.search(r"\n## ", task_section_content)
    if next_section_match:
        task_section_content = task_section_content[:next_section_match.start()]

    return CHECKLIST_ITEM_PATTERN.findall(task_section_content)

def prepare_task_data():
    """
    Loads all loop files, parses their frontmatter and tasks,
    and saves the structured data to a JSON file for the frontend.
    """
    if not LOOPS_DIR.exists():
        print(f"Error: Loops directory not found at '{LOOPS_DIR}'")
        return

    all_tasks = []
    
    print(f"🔍 Parsing loop files from '{LOOPS_DIR}'...")

    for loop_file_path in LOOPS_DIR.glob("*.md"):
        try:
            post = frontmatter.load(loop_file_path)
            metadata = post.metadata
            content = post.content
            
            loop_uuid = metadata.get('uuid', 'N/A')
            loop_title = metadata.get('title', 'Untitled Loop')
            loop_phase = metadata.get('phase', 'N/A')
            loop_workstream = metadata.get('workstream', 'N/A')
            loop_tags = metadata.get('tags', [])

            tasks = parse_tasks_from_content(content)

            for is_checked_str, description in tasks:
                all_tasks.append({
                    "id": f"{loop_uuid}-{description[:20]}",
                    "description": description.strip(),
                    "is_complete": is_checked_str.lower() == 'x',
                    "source_loop": {
                        "uuid": loop_uuid,
                        "title": loop_title,
                        "phase": loop_phase,
                        "workstream": loop_workstream,
                        "tags": loop_tags
                    }
                })
        except Exception as e:
            print(f"⚠️  Could not process file {loop_file_path.name}: {e}")

    # Ensure the output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Write the data to the JSON file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_tasks, f, indent=2)

    print(f"\n✅ Successfully parsed {len(all_tasks)} tasks from {len(list(LOOPS_DIR.glob('*.md')))} loop files.")
    print(f"Data written to '{OUTPUT_FILE}'")


if __name__ == "__main__":
    # Ensure dependencies are available.
    try:
        import yaml
        import frontmatter
    except ImportError:
        print("Error: PyYAML or python-frontmatter is not installed.")
        print("Please install them using: .venv/bin/pip install PyYAML python-frontmatter")
        exit(1)
        
    prepare_task_data() 