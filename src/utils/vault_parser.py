from datetime import datetime
from pathlib import Path

VAULT_PATH = Path.home() / "EA-Vault-Sandbox"
OVERVIEW_FILE = VAULT_PATH / "architecture" / "vault_overview.md"
LOG_FILE = Path.home() / "ea_assistant" / "logs" / "system-log.md"

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

def log_summary(summary_text):
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as log:
        log.write(f"\n## Vault Structure Summary – {now}\n")
        log.write(summary_text)
        log.write("\n")

def structure_summary_report(structure):
    report = []
    for folder, files in structure.items():
        report.append(f"### {folder}/")
        report.append(f"- {len(files)} markdown files")
        for f in files:
            report.append(f"  - {f}")
        report.append("")
    return "\n".join(report)

if __name__ == "__main__":
    print("🔍 Parsing vault_overview.md...")
    structure = parse_overview()
    if isinstance(structure, str):
        print(structure)
    else:
        report = structure_summary_report(structure)
        print(report)
        log_summary(report)
        print("✅ Summary logged to system-log.md")
