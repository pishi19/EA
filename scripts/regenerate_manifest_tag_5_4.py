import hashlib
from pathlib import Path

import yaml

base_dir = Path(__file__).resolve().parents[1]
manifest_path = base_dir / ".system_manifest.yaml"

def hash_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

tracked = {}
for ext in [".py", ".yaml", ".md"]:
    for path in base_dir.rglob(f"*{ext}"):
        if ".venv" in str(path) or "node_modules" in str(path):
            continue
        rel_path = path.relative_to(base_dir)
        tracked[str(rel_path)] = hash_file(path)

with open(manifest_path, "w") as f:
    yaml.dump({"phase": "phase-5.4-scaffolded", "files": tracked}, f)

print(f"✅ Manifest written to {manifest_path}")
