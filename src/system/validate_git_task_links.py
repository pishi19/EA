import re
import subprocess
from pathlib import Path
import yaml

# --- Configuration ---
PROJECT_ROOT = Path(__file__).resolve().parents[2]
LOOPS_DIR = PROJECT_ROOT / "runtime/loops"

# --- Helper Functions ---

def get_git_commit_subjects():
    """
    Fetches all Git commit subjects from the repository history.
    Returns a list of commit subject strings.
    """
    try:
        # Using --pretty=format:%s to get just the subject line of the commit
        result = subprocess.run(
            ["git", "log", "--pretty=format:%s"],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip().split("\n")
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"Error fetching Git history: {e}")
        print("Please ensure you are in a Git repository and 'git' is installed.")
        return []

def parse_frontmatter_uuid(content):
    """
    Parses YAML frontmatter from a markdown file to extract the 'uuid'.
    """
    try:
        if content.startswith("---"):
            parts = content.split('---', 2)
            if len(parts) > 2:
                frontmatter = yaml.safe_load(parts[1])
                if isinstance(frontmatter, dict) and 'uuid' in frontmatter:
                    return str(frontmatter['uuid'])
    except yaml.YAMLError as e:
        print(f"Warning: YAML parsing error in a loop file: {e}")
    return None

def parse_checklist_tasks(content):
    """
    Parses a markdown string to find checklist items and returns their descriptions.
    """
    checklist_pattern = re.compile(r"-\s*\[(x|\s)\]\s*(.*)", re.IGNORECASE)
    return [match[1] for match in checklist_pattern.findall(content)]

def load_loop_identifiers():
    """
    Loads all loop UUIDs and task descriptions from the loop files.
    """
    identifiers = set()
    if not LOOPS_DIR.exists():
        print(f"Error: Loops directory not found at '{LOOPS_DIR}'")
        return identifiers

    for loop_file_path in LOOPS_DIR.glob("*.md"):
        content = loop_file_path.read_text(encoding="utf-8")
        
        # Add UUID from frontmatter
        uuid = parse_frontmatter_uuid(content)
        if uuid:
            identifiers.add(uuid)
            # Also add the first part of the UUID for partial matches
            identifiers.add(uuid.split('-')[0])

        # Add task descriptions
        tasks = parse_checklist_tasks(content)
        for task in tasks:
            # Add the full task as an identifier, can be tuned for more specific keywords
            # For now, let's keep it simple and use significant words.
            # This part can be enhanced with more sophisticated NLP.
            # Example: `Create a new script: src/system/validate_git_task_links.py` -> "validate_git_task_links"
            cleaned_task = re.sub(r'[`"\'():]', '', task).strip()
            # Let's take words longer than 5 chars as potential keywords
            keywords = {word for word in cleaned_task.split() if len(word) > 5}
            identifiers.update(keywords)
            
    return identifiers

# --- Main Logic ---

def validate_git_commit_linkage():
    """
    Validates that each Git commit is linked to a loop task or UUID.
    """
    print("🔍 Starting Git commit linkage validation...")
    
    commit_subjects = get_git_commit_subjects()
    if not commit_subjects:
        print("No commits found or error fetching history. Exiting.")
        return

    loop_identifiers = load_loop_identifiers()
    if not loop_identifiers:
        print("No loop identifiers found to check against. Exiting.")
        return

    unlinked_commits = []
    for subject in commit_subjects:
        # Check if any identifier is present in the commit subject
        if not any(identifier in subject for identifier in loop_identifiers):
            unlinked_commits.append(subject)

    if not unlinked_commits:
        print("\n🎉 Validation complete. All Git commits appear to be linked to a task or loop.")
    else:
        print(f"\n⚠️  Found {len(unlinked_commits)} commits without clear linkage:")
        for subject in unlinked_commits:
            print(f"  - {subject}")
        print("\nConsider revising these commit messages to include a reference to a loop UUID or task.")

if __name__ == "__main__":
    # Ensure PyYAML is installed, as it's a soft dependency for this script
    try:
        import yaml
    except ImportError:
        print("Error: PyYAML is not installed. Please install it using 'pip install PyYAML'.")
        exit(1)
    
    validate_git_commit_linkage() 