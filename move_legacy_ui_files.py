import os
import shutil

pages_dir = "src/ui/pages"
legacy_dir = os.path.join(pages_dir, "../pages_legacy")
os.makedirs(legacy_dir, exist_ok=True)

moved_files = []

for filename in os.listdir(pages_dir):
    if filename.endswith(".py") and (filename[0].isdigit() or filename.startswith("_")):
        src = os.path.join(pages_dir, filename)
        dst = os.path.join(legacy_dir, filename)
        shutil.move(src, dst)
        moved_files.append(filename)

print("✅ Legacy multipage files moved to pages_legacy:")
for f in moved_files:
    print("  •", f)

print("📂 Modular UI files (page_*.py) remain active in src/ui/pages/") 