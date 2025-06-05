import os
from pathlib import Path
import frontmatter # This library needs to be installed (e.g., pip install python-frontmatter)
from datetime import date

VAULT_DIR = Path("vault")
TARGET_DIR = Path("runtime/loops")
DRY_RUN = False  # This should be False for actual migration

TARGET_DIR.mkdir(parents=True, exist_ok=True)

migrated = []
skipped = []

print(f"🔍 Scanning directory: {VAULT_DIR.resolve()}")
if not DRY_RUN:
    print("🚀 Executing actual migration...")

for dirpath, _, filenames in os.walk(VAULT_DIR):
    for file in filenames:
        if file.endswith(".md"):
            source_path = Path(dirpath) / file
            try:
                post = frontmatter.load(source_path)
                if post.metadata.get("title") or post.metadata.get("tags") or post.metadata.get("summary"):
                    post.metadata["origin"] = "vault"
                    post.metadata["migrated"] = str(date.today())
                    dest_path = TARGET_DIR / file

                    if not DRY_RUN:
                        try:
                            with open(dest_path, "w") as f:
                                f.write(frontmatter.dumps(post))
                            migrated.append((source_path, dest_path))
                        except Exception as e_write:
                            print(f"❌ Error writing {dest_path} for source {source_path}: {e_write}")
                            skipped.append(source_path) # Add to skipped if write fails
                    else: # If it is a dry run
                        migrated.append((source_path, dest_path))
                else:
                    skipped.append(source_path)
            except Exception as e_load:
                print(f"⚠️ Error processing {source_path}: {e_load}")
                skipped.append(source_path)

# 🔍 Summary
if DRY_RUN:
    print("--- Dry Run Summary ---")
    print("📢 NOTE: This is a DRY RUN. No files were moved or modified.")
    print(f"Identified {len(migrated)} loop files for migration:")
    for src, dst in migrated:
        print(f"  • Would move: {src} → {dst}")
else:
    print("--- Migration Summary ---")
    print(f"Successfully migrated {len(migrated)} loop files:")
    for src, dst in migrated:
        print(f"  • Migrated: {src} → {dst}")

# Consolidate skipped reasons for clarity in the output
print(f"\nSkipped {len(skipped)} files (due to being non-loop, unreadable, load errors, or write errors):")
for f_path in skipped:
    if DRY_RUN:
        print(f"  • Would skip: {f_path}")
    else:
        print(f"  • Skipped: {f_path}")

if DRY_RUN:
    print("\n✅ If this looks correct, set DRY_RUN = False in the script and re-run to migrate.")
else:
    if skipped: # If there are any skipped files after an actual run
        print("\n⚠️ Some files were skipped or failed during processing/writing. Please review the messages above for details.")
    print("\n✅ Migration process complete.") 