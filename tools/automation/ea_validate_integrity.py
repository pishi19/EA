
#!/usr/bin/env python3

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT.parent
REPORT_PATH = PROJECT_ROOT / "system_integrity_report.md"

def header(text):
    return f"\n\n## {text}\n\n"

def check_path_references():
    issues = []
    for file in PROJECT_ROOT.rglob("*"):
        if file.is_file() and file.suffix in [".py", ".md", ".sh"]:
            if file.name == "system_integrity_report.md":
                continue
            try:
                content = file.read_text(encoding="utf-8")
                if "ea_assistant" in content and "contains reference to `ea_assistant`" not in content:
                    issues.append(f"- [ ] `{file.relative_to(PROJECT_ROOT)}` contains reference to `ea_assistant`")
            except Exception as e:
                issues.append(f"- [ ] Could not read `{file}`: {e}")
    return header("🔗 Hardcoded Path References") + "\n".join(issues) if issues else header("✅ No hardcoded path references found.")

def discover_all_sessions():
    session_ids = set()
    for file in PROJECT_ROOT.rglob("*.md"):
        if file.is_file():
            try:
                if re.match(r"\d{4}-\d{2}-\d{2}-", file.stem):
                    session_ids.add(file.stem.strip())
            except Exception:
                continue
    return session_ids

def check_unlinked_sessions():
    all_sessions = discover_all_sessions()
    issues = []

    for file in PROJECT_ROOT.rglob("*.md"):
        if file.is_file():
            try:
                content = file.read_text(encoding="utf-8")
            except Exception:
                continue
            matches = re.findall(r"linked_sessions:\n((?:\s+- .+\n)+)", content)
            for match in matches:
                for line in match.strip().splitlines():
                    session_id = line.strip().lstrip("- ").strip()
                    if session_id not in all_sessions:
                        issues.append(f"- [ ] `{file.relative_to(PROJECT_ROOT)}` references missing session `{session_id}`")

    return header("🔁 Linked Sessions Integrity") + "\n".join(issues) if issues else header("✅ All session links resolve correctly.")

def run_integrity_check():
    report = "# ✅ EA System Integrity Report\n"
    report += check_path_references()
    report += check_unlinked_sessions()
    REPORT_PATH.write_text(report, encoding="utf-8")
    print(f"Report generated at {REPORT_PATH}")

if __name__ == "__main__":
    run_integrity_check()
