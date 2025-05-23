from pathlib import Path

base_path = Path.home() / "ea_assistant"
for path in sorted(base_path.rglob("*")):
    rel = path.relative_to(base_path)
    prefix = "📁" if path.is_dir() else "📄"
    print(f"{prefix} {rel}")
