import json
import os
from pathlib import Path

VAULT_PATH = Path.home() / "EA-Vault-Sandbox"
SNAPSHOT_FILE = Path.home() / "ea_assistant" / "vault_structure_snapshot.json"


def generate_structure(vault_path):
    structure = {}
    for root, dirs, files in os.walk(vault_path):
        rel_path = Path(root).relative_to(vault_path)
        folder_key = str(rel_path) if rel_path != Path(".") else "root"
        structure[folder_key] = [f for f in files if f.endswith(".md")]
    return structure


def save_snapshot(structure):
    SNAPSHOT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SNAPSHOT_FILE, "w") as f:
        json.dump(structure, f, indent=2)
    print(f"✅ Vault snapshot written to: {SNAPSHOT_FILE}")


if __name__ == "__main__":
    structure = generate_structure(VAULT_PATH)
    save_snapshot(structure)
