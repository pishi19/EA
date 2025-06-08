import argparse
import datetime
import subprocess
import typing
from pathlib import Path

import frontmatter

# --- Configuration ---
# VAULT_ROOT_DIRS: These are the top-level directories to scan recursively.
# The script will search for any .md file within these and their subdirectories.
INITIAL_SCAN_ROOT_PATHS_STR = [
    "vault/Retrospectives/Loops/",
    "vault/Programs/",
    "vault/CRM Migration/",
    "vault/Partner Growth/"
    # Add more paths here as needed
]

TARGET_LOOP_DIR = Path("runtime/loops/")
QDRANT_EMBEDDER_SCRIPT = Path("src/memory/update_qdrant_embeddings.py")
TODAY_ISO = datetime.date.today().isoformat()

# --- Helper Functions ---

def process_loop_file(file_path: Path, dry_run: bool = False) -> tuple[str, typing.Optional[str]]:
    """
    Processes a single loop file: reads frontmatter, updates it,
    copies to target, and calls embedder.
    Returns a status string and the new path if successful.
    """
    try:
        with file_path.open('r', encoding='utf-8') as f:
            post = frontmatter.load(f)
    except Exception as e:
        return f"skipped_format_error (cannot load frontmatter for {file_path.name}: {e})", None

    # Add/update metadata
    post.metadata['origin'] = 'vault'
    post.metadata['migrated'] = TODAY_ISO

    target_file_path = TARGET_LOOP_DIR / file_path.name

    if target_file_path.exists() and not dry_run: # Only check for existing if not dry run to allow previewing duplicates
        return f"skipped_duplicate (target '{target_file_path.name}\' already exists)", None

    if dry_run:
        print(f"[DRY RUN] Would migrate: {file_path} -> {target_file_path}")
        print(f"[DRY RUN]   Old metadata (sample): {dict(list(post.metadata.items())[:2])}...") # Show a sample
        updated_meta_preview = post.metadata.copy()
        updated_meta_preview['origin'] = 'vault'
        updated_meta_preview['migrated'] = TODAY_ISO
        print(f"[DRY RUN]   New metadata would include: {{origin: vault, migrated: {TODAY_ISO}}}")
        if target_file_path.exists():
            print(f"[DRY RUN]   Target file '{target_file_path.name}\' already exists. Would be skipped in non-dry run.")
        return "dry_run_migrated", str(target_file_path)

    # Ensure target directory exists
    TARGET_LOOP_DIR.mkdir(parents=True, exist_ok=True)

    try:
        with open(target_file_path, 'wb') as f: # frontmatter.dump needs binary mode for UTF-8
            frontmatter.dump(post, f, encoding='utf-8')
        print(f"✅ Migrated: {file_path} -> {target_file_path}")
    except Exception as e:
        return f"error_writing_file ({target_file_path.name}: {e})", None

    # Call Qdrant embedder script
    try:
        script_path_str = str(QDRANT_EMBEDDER_SCRIPT.resolve())
        new_file_path_str = str(target_file_path.resolve())

        print(f"⏳ Calling embedder for: {new_file_path_str}")
        python_executable = "python" # Assumes python is in PATH and is the correct one

        result = subprocess.run(
            [python_executable, script_path_str, new_file_path_str],
            capture_output=True, text=True, check=False, encoding='utf-8'
        )
        if result.returncode == 0:
            print(f"↪️ Embedder output for {target_file_path.name}:\n{result.stdout.strip()}")
            if result.stderr.strip():
                 print(f"⚠️ Embedder stderr for {target_file_path.name}:\n{result.stderr.strip()}")
        else:
            print(f"❌ Embedder script failed for {target_file_path.name} (Return Code: {result.returncode}):")
            print(f"   Stdout:\n{result.stdout.strip()}")
            print(f"   Stderr:\n{result.stderr.strip()}")
            return "migrated_embed_failed", str(target_file_path)

    except FileNotFoundError:
        print(f"❌ Error: Embedder script at '{script_path_str}\' not found.")
        return "migrated_embed_script_not_found", str(target_file_path)
    except Exception as e:
        print(f"❌ Unexpected error during embedding call for {target_file_path.name}: {e}")
        return "migrated_embed_unexpected_error", str(target_file_path)

    return "migrated_embedded", str(target_file_path)

# --- Main Execution ---
def main():
    parser = argparse.ArgumentParser(description="Migrate loop files from vault to runtime/loops and embed them.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview files that would be migrated without actually writing or embedding."
    )
    args = parser.parse_args()

    if args.dry_run:
        print("DRY RUN MODE: No files will be written or embedded.\n")

    all_potential_md_files = []
    for root_path_str in INITIAL_SCAN_ROOT_PATHS_STR:
        root_dir = Path(root_path_str)
        if root_dir.is_dir():
            print(f"Scanning under: {root_dir}")
            all_potential_md_files.extend(list(root_dir.rglob('*.md')))
        else:
            print(f"ℹ️ Configured scan directory not found, skipping: {root_dir}")

    # Filter for actual files and remove duplicates if any scan paths overlapped
    source_md_files = sorted(list(set(p for p in all_potential_md_files if p.is_file())))

    if not source_md_files:
        print("No .md files found in the specified vault directories.")
        return

    print(f"Found {len(source_md_files)} potential .md files to process.")

    migrated_count = 0
    skipped_count = 0 # For dry run, count files that would be skipped due to duplication too
    actual_migrated_in_dry_run = 0
    error_files = []
    processed_in_dry_run = 0
    skipped_files = [] # Initialize skipped_files outside the dry_run conditional

    # Ensure target directory exists for non-dry run
    if not args.dry_run:
        TARGET_LOOP_DIR.mkdir(parents=True, exist_ok=True)

    for md_file in source_md_files:
        print(f"---\nProcessing: {md_file}")
        status, new_path_str = process_loop_file(md_file, args.dry_run)

        if args.dry_run:
            processed_in_dry_run +=1
            if status == "dry_run_migrated":
                # Check if it would have been skipped due to duplication in a real run
                target_file_path_check = TARGET_LOOP_DIR / md_file.name
                if not target_file_path_check.exists():
                    actual_migrated_in_dry_run += 1
                else:
                    # It exists, so it would have been skipped
                    skipped_count +=1
            elif status.startswith("skipped"):
                 skipped_count +=1
            # No explicit error count for dry run, errors are printed directly

        else: # Not a dry run
            if status.startswith("migrated"):
                migrated_count += 1
            elif status.startswith("skipped"):
                skipped_files.append(f"{md_file} (Reason: {status.split('(', 1)[-1].rstrip(')')})")
            else: # error cases
                error_files.append(f"{md_file} (Status: {status})")

    print("\n--- Migration Summary ---")
    if args.dry_run:
        print(f"[DRY RUN] Files scanned: {len(source_md_files)}")
        print(f"[DRY RUN] Would attempt to process (if not duplicate): {actual_migrated_in_dry_run} files.")
        print(f"[DRY RUN] Would be skipped (format error, duplicate, etc.): {processed_in_dry_run - actual_migrated_in_dry_run + skipped_count} files (includes pre-existing target files)." ) # Estimate
    else:
        print(f"Successfully migrated and attempted embedding for {migrated_count} loops.")
        if skipped_files:
            print(f"\nSkipped {len(skipped_files)} files:")
            for f_info in skipped_files:
                print(f"- {f_info}")
        if error_files:
            print(f"\nEncountered errors with {len(error_files)} files (see logs above for details):")
            for f_info in error_files:
                print(f"- {f_info}")

    print("Migration process complete.")

if __name__ == "__main__":
    main()
