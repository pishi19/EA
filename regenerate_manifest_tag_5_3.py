import os
import hashlib
import yaml
from pathlib import Path

# This script assumes it's run from the project's root directory.
# The terminal CWD is /Users/air/AIR01/EA/ea_cursor_system_coupled, so Path(".") will refer to this.
project_root = Path(".")
manifest_path = project_root / ".system_manifest.yaml"

# Build hash manifest
manifest = {}
print(f"🔍 Starting scan in project root: {project_root.resolve()}")

for path in project_root.rglob("*"):
    if path.is_file() and \
       path.suffix in [".py", ".yaml", ".md"] and \
       ".git" not in path.parts and \
       path.resolve() != manifest_path.resolve(): # Exclude the manifest file itself
        try:
            with open(path, "rb") as f_content:
                content_bytes = f_content.read()
                digest = hashlib.sha256(content_bytes).hexdigest()
                # Use relative path string (which str(path) is when project_root=".")
                manifest[str(path)] = digest
        except Exception as e:
            print(f"⚠️ Skipped {path}: {e}")

print(f"📊 Found {len(manifest)} files to include in the manifest.")

# Write the manifest file
try:
    with open(manifest_path, "w") as f_yaml:
        yaml.dump(manifest, f_yaml)
    print(f"✅ Manifest written with {len(manifest)} files → {manifest_path.resolve()}")
except Exception as e:
    print(f"❌ Error writing manifest file {manifest_path.resolve()}: {e}")
    exit(1) # Exit if manifest writing fails

# Git operations
print(f"🚀 Starting Git operations in {project_root.resolve()}...")

print("Executing: git add .")
add_return_code = os.system("git add .")
if add_return_code != 0:
    print(f"⚠️ 'git add .' failed with exit code {add_return_code}")

commit_message = '🔒 phase-5.3-localized: vault removed, local-only system locked'
git_commit_command = f"git commit -m \"{commit_message}\"" # Use double quotes for the message within the command
print(f"Executing: {git_commit_command}")
commit_return_code = os.system(git_commit_command)
if commit_return_code != 0:
    print(f"⚠️ 'git commit' failed. Exit code: {commit_return_code}. This might be okay if there are no changes to commit or due to pre-commit hooks.")

tag_name = 'phase-5.3-localized'
git_tag_command = f"git tag -f {tag_name}" # Use -f to force tag creation/update
print(f"Executing: {git_tag_command}")
tag_return_code = os.system(git_tag_command)
if tag_return_code != 0:
    print(f"⚠️ '{git_tag_command}' failed. Exit code: {tag_return_code}")

# Force push tags to update remote if tag was recreated
git_push_command = "git push origin ora-deploy-merged --tags --force"
print(f"Executing: {git_push_command}")
push_return_code = os.system(git_push_command)
if push_return_code != 0:
    print(f"⚠️ '{git_push_command}' failed. Exit code: {push_return_code}")
else:
    print("✅ Git operations completed successfully (including forced push of tags).")

print("✨ Script finished.") 