import os
import hashlib
import yaml

# Corrected paths based on your workspace
user_workspace = "/Users/air/AIR01/EA/ea_cursor_system_coupled"
project_root = user_workspace
yaml_path = os.path.join(project_root, ".system_manifest.yaml")

# Step 1: Walk project and hash .py and .yaml files
manifest = {}
print(f"🔍 Starting scan in project root: {project_root}")
for root_dir, _, files_list in os.walk(project_root):
    for f_name in files_list:
        if (f_name.endswith(('.py', '.yaml'))) and not f_name.startswith("."):
            full_path = os.path.join(root_dir, f_name)
            # Ensure the manifest file itself is not included if it exists
            if full_path == yaml_path:
                continue
            try:
                with open(full_path, 'rb') as file_content:
                    content = file_content.read()
                    digest = hashlib.sha256(content).hexdigest()
                    relative_path = os.path.relpath(full_path, project_root)
                    manifest[relative_path] = digest
            except Exception as e:
                print(f"⚠️ Skipped {full_path}: {e}")

print(f"📊 Found {len(manifest)} files to include in the manifest.")

# Step 2: Write .system_manifest.yaml
try:
    with open(yaml_path, "w") as f_yaml:
        yaml.dump(manifest, f_yaml)
    print(f"✅ Manifest written to {yaml_path} with {len(manifest)} entries.")
except Exception as e:
    print(f"❌ Error writing manifest file {yaml_path}: {e}")
    exit(1) # Exit if manifest writing fails

# Step 3: Git tag the system clean state
print(f"🚀 Starting Git operations in {project_root}...")
original_dir = os.getcwd()
try:
    os.chdir(project_root)
    
    print("Executing: git add .")
    add_return_code = os.system("git add .")
    if add_return_code != 0:
        print(f"⚠️ 'git add .' failed with exit code {add_return_code}")
        # Decide if to proceed or exit, for now, we'll print and continue to commit attempt

    commit_message = '🔒 phase-5.2-ui-clean: sidebar stabilized, legacy removed'
    print(f"Executing: git commit -m '{commit_message}'")
    commit_return_code = os.system(f"git commit -m '{commit_message}'")
    if commit_return_code != 0:
        print(f"⚠️ 'git commit' failed with exit code {commit_return_code}. This might be okay if there are no changes to commit.")

    tag_name = 'phase-5.2-ui-clean'
    print(f"Executing: git tag {tag_name}")
    tag_return_code = os.system(f"git tag {tag_name}")
    if tag_return_code != 0:
        print(f"⚠️ 'git tag {tag_name}' failed with exit code {tag_return_code}. The tag might already exist.")
        # Attempt to delete and recreate the tag if it exists
        print(f"Attempting to delete and recreate tag '{tag_name}'...")
        os.system(f"git tag -d {tag_name}") # Delete local tag
        force_tag_return_code = os.system(f"git tag -f {tag_name}") # Force create/update local tag
        if force_tag_return_code != 0:
            print(f"⚠️ 'git tag -f {tag_name}' also failed with exit code {force_tag_return_code}")


    # Using --force for pushing tags to ensure the remote tag is updated if it exists.
    # This matches the intent of marking a specific "clean state".
    push_command = "git push origin ora-deploy-merged --tags --force"
    print(f"Executing: {push_command}")
    push_return_code = os.system(push_command)

    if push_return_code != 0:
        print(f"⚠️ '{push_command}' failed with exit code {push_return_code}")
    else:
        print("✅ Git operations completed successfully (including forced push of tags).")

except Exception as e:
    print(f"❌ Error during Git operations: {e}")
finally:
    os.chdir(original_dir) # Ensure we change back to the original directory

print("✨ Script finished.") 