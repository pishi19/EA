import os
from datetime import datetime
from pathlib import Path

# Define the Obsidian vault root
VAULT_PATH = Path.home() / "EA-Vault-Sandbox"
LOG_FILE = Path.home() / "ea_assistant" / "logs" / "system-log.md"

def scan_folder_structure(vault_path):
    folder_tree = []
    for root, dirs, files in os.walk(vault_path):
        if any(skip in root for skip in [".trash", "__pycache__", ".git"]):
            continue
        level = root.replace(str(vault_path), "").count(os.sep)
        indent = "  " * level
        folder_tree.append(f"{indent}- 📁 {Path(root).name}/")
        for file in sorted(files):
            if file.endswith(".md"):
                file_path = Path(root) / file
                mod_time = datetime.fromtimestamp(file_path.stat().st_mtime).strftime("%Y-%m-%d")
                folder_tree.append(f"{indent}  - {file} (last modified: {mod_time})")
    return "\n".join(folder_tree)

def log_output(text):
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as log:
        log.write(f"\n## Vault Structure – {now}\n")
        log.write(text)
        log.write("\n")

def main():
    print("🔍 Reading full Obsidian vault folder structure...")
    output = scan_folder_structure(VAULT_PATH)
    print(output)
    log_output(output)
    print("✅ Vault structure logged to system-log.md")

if __name__ == "__main__":
    main()
