from pathlib import Path
from datetime import datetime
from audit_yaml import audit_yaml_structure
from audit_orphans import find_orphan_loops

# Correct target directory
DASHBOARD_PATH = Path("/Users/air/AIR01/0001-HQ/Dashboards/loop_audit_dashboard.md")
DASHBOARD_PATH.parent.mkdir(parents=True, exist_ok=True)

def main():
    issues = audit_yaml_structure()
    orphans = find_orphan_loops()

    lines = ["# 🔍 Loop Audit Dashboard", ""]
    lines.append(f"📅 Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")

    if issues:
        lines.append("## ❗ YAML Structure Issues")
        lines.extend(issues)
    else:
        lines.append("✅ All loops have valid YAML structure.")

    lines.append("\n## 🧩 Orphaned Loops")
    if orphans:
        lines.extend(f"- 🧭 [[{loop}]]" for loop in orphans)
    else:
        lines.append("✅ All loops are referenced in tasks, summaries, or dashboards.")

    DASHBOARD_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"✅ Loop audit dashboard written to: {DASHBOARD_PATH}")

if __name__ == "__main__":
    main()