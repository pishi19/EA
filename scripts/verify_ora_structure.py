from pathlib import Path
import sys

base = Path(__file__).resolve().parents[1]  # go up from scripts/ to project root

checks = {
    "Root folder": base,
    "runtime/loops": base / "runtime" / "loops",
    "runtime/inbox": base / "runtime" / "inbox",
    "src/ui/main.py": base / "src" / "ui" / "main.py",
    "src/ui/pages/1_Inbox.py": base / "src" / "ui" / "pages" / "1_Inbox.py",
    "src/system/trust.py": base / "src" / "system" / "trust.py",
    "src/data/workstream_loader.py": base / "src" / "data" / "workstream_loader.py",
    ".system_manifest.yaml": base / ".system_manifest.yaml",
}

missing = []
for label, path in checks.items():
    if not path.exists():
        missing.append(f"❌ {label} → MISSING at {path}")
    else:
        print(f"✅ {label} → {path.relative_to(base)}")

if missing:
    print("\n---\n🛑 Some critical files/folders are missing:")
    for m in missing:
        print(m)
    sys.exit(1)
else:
    print("\n✅ All essential Ora structure is present.") 