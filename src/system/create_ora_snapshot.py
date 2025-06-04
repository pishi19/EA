import subprocess
from pathlib import Path
from datetime import datetime
import sys
import os

def run_git_command(command_parts, cwd_path):
    """Runs a Git command and returns (return_code, stdout, stderr)."""
    try:
        process = subprocess.run(
            command_parts,
            cwd=cwd_path,
            text=True,
            capture_output=True,
            check=False  # Handle non-zero exit manually
        )
        # For git commit, "nothing to commit" might be in stdout for some git versions
        is_commit_cmd = len(command_parts) > 1 and command_parts[1] == "commit"
        nothing_to_commit_msg = "nothing to commit"
        
        if process.returncode != 0 and not (is_commit_cmd and nothing_to_commit_msg in (process.stdout + process.stderr).lower()):
            print(f"Error running git command '{' '.join(command_parts)}':")
            if process.stdout:
                print(f"  Stdout: {process.stdout.strip()}")
            if process.stderr:
                print(f"  Stderr: {process.stderr.strip()}")
        return process.returncode, process.stdout.strip(), process.stderr.strip()
    except FileNotFoundError:
        print(f"Error: git command not found. Ensure git is installed and in PATH.")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred while running git command '{' '.join(command_parts)}': {e}")
        sys.exit(1)

def main():
    project_root = Path(__file__).resolve().parents[2]
    # Ensure commands run from project root
    # os.chdir(project_root) # Alternative: pass cwd to all run_git_command calls

    manifest_file = Path(".system_manifest.yaml")
    manifest_abs_path = project_root / manifest_file

    if not manifest_abs_path.exists():
        print(f"Error: Manifest file not found at {manifest_abs_path}")
        sys.exit(1)

    now = datetime.now()
    timestamp_msg_format = now.strftime("%Y-%m-%d %H:%M")
    timestamp_file_format = now.strftime("%Y%m%d")
    timestamp_log_header_format = now.strftime("%Y-%m-%d %H:%M")

    # 1. Stage .system_manifest.yaml and any updated tracked files
    print(f"🔍 Staging {manifest_file}...")
    run_git_command(["git", "add", str(manifest_file)], cwd_path=project_root)
    
    print("🔍 Staging updated tracked files (-u)...")
    run_git_command(["git", "add", "-u"], cwd_path=project_root)

    # Check for staged files
    ret_code, staged_files_str, err_staged = run_git_command(["git", "diff", "--name-only", "--cached"], cwd_path=project_root)
    if ret_code != 0:
        print(f"Error checking for staged files: {err_staged}")
        sys.exit(1)
    
    staged_files_list = [f for f in staged_files_str.splitlines() if f]
    if not staged_files_list:
        print("✅ No changes staged for snapshot. Exiting.")
        sys.exit(0)

    # 2. Git Commit
    commit_message = f"snapshot: [auto] system snapshot {timestamp_msg_format}"
    print(f"📝 Committing with message: '{commit_message}'...")
    ret_code, commit_stdout, commit_stderr = run_git_command(["git", "commit", "-m", commit_message], cwd_path=project_root)
    
    if ret_code != 0:
        if "nothing to commit" in (commit_stdout + commit_stderr).lower():
            print("✅ No changes to commit for snapshot. Exiting.")
            sys.exit(0)
        else:
            print(f"Error during git commit.") # Specific error already printed by run_git_command
            sys.exit(1)
    
    # Get commit ID
    ret_code, commit_id, err_rev = run_git_command(["git", "rev-parse", "HEAD"], cwd_path=project_root)
    if ret_code != 0:
        print(f"Error getting commit ID: {err_rev}")
        sys.exit(1)
    commit_id = commit_id.strip()

    # 3. Git Tag
    is_sunday = now.weekday() == 6  # Monday is 0 and Sunday is 6
    tag_prefix = "snapshot-weekly-" if is_sunday else "snapshot-daily-"
    tag_name = f"{tag_prefix}{timestamp_file_format}"
    print(f"🏷️ Creating tag: {tag_name}...")
    ret_code, _, err_tag = run_git_command(["git", "tag", tag_name], cwd_path=project_root)
    if ret_code != 0:
        # Tagging might fail if tag already exists. This is a warning, not a critical error.
        print(f"⚠️ Warning: Could not create tag '{tag_name}'. It might already exist. Error: {err_tag}")
    else:
        print(f"  Tag '{tag_name}' created.")

    # 4. Log System Snapshot
    log_file_path_rel = Path("System/Meta/system_state_view.md")
    log_file_abs_path = project_root / log_file_path_rel
    
    log_entry_header = f"### Snapshot {timestamp_log_header_format}"
    log_entry_files_md = "\n".join([f"       - {f}" for f in staged_files_list]) # Indented for markdown list
    
    log_entry_content = (
        f"\n{log_entry_header}\n"
        f"- Files committed:\n{log_entry_files_md}\n"
        f"- Tag created: {tag_name}\n"
        f"- Commit ID: {commit_id}\n"
    )

    print(f"✍️ Appending snapshot log to {log_file_path_rel}...")
    try:
        log_file_abs_path.parent.mkdir(parents=True, exist_ok=True)
        with open(log_file_abs_path, "a", encoding="utf-8") as f:
            f.write(log_entry_content)
    except Exception as e:
        print(f"Error writing to log file {log_file_abs_path}: {e}")
        sys.exit(1) # Consider this critical

    print(f"\n✅ System snapshot created successfully.")
    print(f"  Commit: {commit_id}")
    print(f"  Tag: {tag_name}")
    print(f"  Log updated: {log_file_path_rel}")

if __name__ == "__main__":
    main() 