import os
import re
from pathlib import Path

LOOPS_DIR = Path(__file__).resolve().parents[2] / "runtime/loops"
PROJECT_ROOT = Path(__file__).resolve().parents[2]

def parse_checklist_from_content(content):
    """
    Parses a markdown string to find checklist items.
    Returns a list of tuples: (is_checked, task_description).
    """
    # Regex to find markdown checklist items: - [ ] or - [x]
    checklist_pattern = re.compile(r"-\s*\[(x|\s)\]\s*(.*)", re.IGNORECASE)
    return checklist_pattern.findall(content)

def extract_filenames_from_task(task_description):
    """
    Extracts filenames from a task description string.
    It looks for text enclosed in backticks (`).
    """
    # Regex to find content within backticks
    filename_pattern = re.compile(r"`([^`]+)`")
    return filename_pattern.findall(task_description)

def validate_loop_files():
    """
    Main function to iterate through loop files and validate their task checklists.
    """
    if not LOOPS_DIR.exists() or not LOOPS_DIR.is_dir():
        print(f"Error: Loops directory not found at '{LOOPS_DIR}'")
        return

    print(f"🔍 Starting validation for loop files in '{LOOPS_DIR}'...")
    mismatches_found = False

    for loop_file_path in LOOPS_DIR.glob("*.md"):
        print(f"\n--- Checking file: {loop_file_path.name} ---")
        content = loop_file_path.read_text(encoding="utf-8")
        
        checklist_items = parse_checklist_from_content(content)
        if not checklist_items:
            print("  No checklist items found.")
            continue

        for is_checked_str, task_desc in checklist_items:
            is_checked = is_checked_str.lower() == 'x'
            filenames = extract_filenames_from_task(task_desc)

            if not filenames:
                continue

            for filename in filenames:
                # We assume the path is relative to the project root
                file_to_check = PROJECT_ROOT / filename
                file_exists = file_to_check.exists()

                # Report mismatches
                if is_checked and not file_exists:
                    mismatches_found = True
                    print(f"  ❌ Mismatch: Task is CHECKED, but file '{filename}' does NOT exist.")
                elif not is_checked and file_exists:
                    mismatches_found = True
                    print(f"  ⚠️  Mismatch: Task is UNCHECKED, but file '{filename}' EXISTS.")
                else:
                    status = "Exists" if file_exists else "Does not exist"
                    checked_status = "Checked" if is_checked else "Unchecked"
                    print(f"  ✅ Match: Task is {checked_status} and file '{filename}' status is: {status}.")


    if not mismatches_found:
        print("\n🎉 Validation complete. All task statuses align with file existence.")
    else:
        print("\nValidation complete. Mismatches were found.")

if __name__ == "__main__":
    validate_loop_files() 