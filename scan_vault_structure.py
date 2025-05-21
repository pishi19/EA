import os
from pathlib import Path
from datetime import datetime

# Update this if needed to match your current vault path
VAULT_PATH = Path.home() / "EA-Vault-Sandbox"
OUTPUT_FILE = VAULT_PATH / "architecture" / "vault_overview.md"

def scan_vault_structure(base_path):
    report = ["# EA Vault Structure Overview", f"_Generated: {datetime.now().isoformat()}_", ""]
    for root, dirs, files in os.walk(base_path):
        if any(exclude in root for exclude in ["__pycache__", ".git", ".trash"]):
            continue
        indent_level = root.replace(str(base_path), "").count(os.sep)
        indent = "  " * indent_level
        report.append(f"{indent}- **{Path(root).name}/**")
        for file in files:
            if file.endswith(".md"):
                file_path = Path(root) / file
                mod_time = datetime.fromtimestamp(file_path.stat().st_mtime).strftime("%Y-%m-%d")
                report.append(f"{indent}  - {file} (last modified: {mod_time})")
    return "\n".join(report)

def write_report(content):
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        f.write(content)
    print(f"✅ Vault structure written to: {OUTPUT_FILE}")

if __name__ == "__main__":
    print("🔍 Scanning EA Obsidian vault...")
    md_report = scan_vault_structure(VAULT_PATH)
    write_report(md_report)
