import os
from pathlib import Path
from datetime import datetime

VAULT_PATH = Path.home() / "EA-Vault-Sandbox"
OVERVIEW_FILE = VAULT_PATH / "architecture" / "vault_overview.md"
LOG_FILE = Path.home() / "ea_assistant" / "logs" / "system-log.md"

EXPECTED_FOLDERS = ["01 Periodic", "02 Projects", "03 Areas", "04 Resources", "Archive", "Journal"]

def parse_overview():
    if not OVERVIEW_FILE.exists():
        return "⚠️ vault_overview.md not found."

    with open(OVERVIEW_FILE, "r") as f:
        lines = f.readlines()

    structure = {}
    current_folder = None
    for line in lines:
        line = line.strip()
        if line.startswith("- **") and line.endswith("/**"):
            current_folder = line.replace("- **", "").replace("/**", "")
            structure[current_folder] = []
        elif line.startswith("-") and ".md" in line:
            if current_folder:
                file_info = line.replace("- ", "")
                structure[current_folder].append(file_info)

    return structure

def check_alignment(structure):
    report = []
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    report.append(f"## Vault Alignment Check – {now}\n")

    missing_folders = [f for f in EXPECTED_FOLDERS if f not in structure]
    if missing_folders:
        report.append("❌ Missing expected folders:")
        for f in missing_folders:
            report.append(f"- {f}")
    else:
        report.append("✅ All expected PARA folders are present.")

    unexpected = [f for f in structure if f not in EXPECTED_FOLDERS]
    if unexpected:
        report.append("\n⚠️ Unexpected folders found:")
        for f in unexpected:
            report.append(f"- {f}")

    for f in EXPECTED_FOLDERS:
        count = len(structure.get(f, []))
        report.append(f"📁 {f}/ → {count} markdown files")

    return "\n".join(report)

def log_report(report):
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as log:
        log.write(f"\n{report}\n")

def main():
    print("🔍 Checking vault alignment...")
    structure = parse_overview()
    if isinstance(structure, str):
        print(structure)
    else:
        report = check_alignment(structure)
        print(report)
        log_report(report)
        print("✅ Alignment check logged to system-log.md")

if __name__ == "__main__":
    main()
