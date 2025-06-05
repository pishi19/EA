from pathlib import Path
import shutil

ui_pages = Path("src/ui/pages")
backup = Path("src/ui/legacy_ui_pages")
backup.mkdir(parents=True, exist_ok=True)

legacy_files = [
    "0_Workstream_Dashboard.py",
    "_0_Dashboard.py",
    "_1_Roadmap.py",
    "_2_Reflections.py",
    "_3_Phase_Tracker.py",
    "page_dashboard.py",
    "page_roadmap.py",
    "page_reflections.py",
    "page_phase_tracker.py",
]

for fname in legacy_files:
    src = ui_pages / fname
    if src.exists():
        shutil.move(str(src), str(backup / fname))
        print(f"✅ Moved {fname} to legacy_ui_pages/")
    else:
        print(f"⚠️ {fname} not found — skipping") 