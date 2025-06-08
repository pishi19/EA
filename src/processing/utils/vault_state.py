import os
from pathlib import Path

VAULT_PATH = Path.home() / "EA-Vault-Sandbox"
VAULT_STRUCTURE = {}


def scan_vault(vault_path):
    structure = {}
    for root, dirs, files in os.walk(vault_path):
        rel_path = Path(root).relative_to(vault_path)
        folder_key = str(rel_path) if rel_path != Path(".") else "root"
        structure[folder_key] = [f for f in files if f.endswith(".md")]
    return structure


def update_vault_structure():
    global VAULT_STRUCTURE
    VAULT_STRUCTURE = scan_vault(VAULT_PATH)
    return VAULT_STRUCTURE


if __name__ == "__main__":
    structure = update_vault_structure()
    print("🔍 Live Vault Structure:")
    for folder, files in structure.items():
        print(f"- {folder}/")
        for file in files:
            print(f"  - {file}")
