import hashlib
import random
import uuid
from pathlib import Path

import yaml

# Determine project root assuming this script is in src/utils/backfill_loop_metadata.py
project_root = Path(__file__).resolve().parent.parent.parent
LOOP_DIR = project_root / "runtime/loops"

SAMPLE_TAGS = ["#useful", "#insightful", "#false_positive", "#confusing"]

def deterministic_uuid(content: str) -> str:
    """Generates a deterministic UUID v5 based on the SHA256 hash of the content."""
    # Using NAMESPACE_DNS as a common namespace, content hash for the name
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, hashlib.sha256(content.encode("utf-8")).hexdigest()))

def backfill_loop_metadata():
    """Backfills missing UUIDs and feedback_tags in loop files."""
    print(f"Starting metadata backfill for loop files in: {LOOP_DIR}")

    if not LOOP_DIR.is_dir():
        print(f"Warning: Loop directory not found: {LOOP_DIR}. Nothing to backfill.")
        return

    updated_count = 0
    for path in LOOP_DIR.glob("*.md"):
        try:
            content = path.read_text(encoding="utf-8")
            parts = content.split("---", 2) # Split only on first two --- occurrences
            if len(parts) < 3:
                print(f"Warning: Malformed file (no valid frontmatter section): {path.name}. Skipping.")
                continue

            try:
                frontmatter = yaml.safe_load(parts[1]) or {}
                if not isinstance(frontmatter, dict):
                    print(f"Warning: Frontmatter in {path.name} is not a dictionary. Treating as empty for backfill.")
                    frontmatter = {} # Default to empty dict if YAML is not a mapping
            except yaml.YAMLError as e:
                print(f"Error parsing YAML frontmatter in {path.name}: {e}. Skipping.")
                continue

            body = parts[2].strip() # Ensure body is stripped
            original_frontmatter_str = parts[1] # Keep original frontmatter string for comparison if needed

            modified = False

            if "uuid" not in frontmatter or not frontmatter.get("uuid"):
                new_uuid = deterministic_uuid(body)
                frontmatter["uuid"] = new_uuid
                print(f"  Adding UUID {new_uuid} to {path.name}")
                modified = True

            # Add feedback_tags only if the key is entirely missing or if it's present but empty/falsy
            if "feedback_tags" not in frontmatter or not frontmatter.get("feedback_tags"):
                # Ensure we don't try to sample more tags than available if SAMPLE_TAGS is small
                k_sample = min(2, len(SAMPLE_TAGS))
                if k_sample > 0:
                    frontmatter["feedback_tags"] = random.sample(SAMPLE_TAGS, k=k_sample)
                    print(f"  Adding random feedback_tags {frontmatter['feedback_tags']} to {path.name}")
                    modified = True
                elif not frontmatter.get("feedback_tags"): # If k_sample is 0 but tags are still missing/empty
                    frontmatter["feedback_tags"] = [] # Set to empty list
                    modified = True # Technically modified if key was missing

            if modified:
                # Preserve comments if any by careful reconstruction (advanced)
                # For simplicity here, we just use safe_dump which might lose comments.
                new_frontmatter_str = yaml.safe_dump(frontmatter, sort_keys=False, indent=2).strip()

                # Only write if the dumped new frontmatter is different from original (besides stripping)
                # This avoids rewriting files just due to YAML formatting changes if no actual data changed.
                # However, simple string comparison might be tricky due to potential minor formatting diffs from safe_load then safe_dump.
                # For robustness of the "modified" flag, we primarily rely on our explicit modifications.

                new_content = f"---\n{new_frontmatter_str}\n---\n\n{body}"
                path.write_text(new_content, encoding="utf-8")
                print(f"✅ Updated: {path.name}")
                updated_count += 1
            else:
                print(f"No metadata changes needed for: {path.name}")

        except FileNotFoundError:
            print(f"Error: File not found during processing: {path.name}. Skipping.") # Should not happen with glob
            continue
        except Exception as e:
            print(f"An unexpected error occurred processing {path.name}: {e}. Skipping.")
            import traceback
            traceback.print_exc()
            continue

    print(f"\nBackfill process complete. {updated_count} file(s) updated.")

if __name__ == "__main__":
    # Create dummy files for testing if LOOP_DIR is empty, some with missing fields
    if not LOOP_DIR.exists():
        LOOP_DIR.mkdir(parents=True, exist_ok=True)

    if not any(LOOP_DIR.glob("*.md")):
        print("Creating dummy loop files for backfill testing...")
        dummy_files_content = {
            "loop_needs_both.md": "---\nproject: Test Alpha\n---\n\nBody for file needing UUID and tags.",
            "loop_needs_tags.md": "---\nuuid: existing-uuid-123\nproject: Test Beta\n---\n\nBody for file needing only tags.",
            "loop_needs_uuid.md": "---\nfeedback_tags: ['#initial']\nproject: Test Gamma\n---\n\nBody for file needing only UUID.",
            "loop_all_good.md": "---\nuuid: complete-uuid-456\nfeedback_tags: ['#useful']\nproject: Test Delta\n---\n\nBody for a complete file."
        }
        for name, text_content in dummy_files_content.items():
            (LOOP_DIR / name).write_text(text_content, encoding="utf-8")
            print(f"Created dummy file: {name}")

    backfill_loop_metadata()
