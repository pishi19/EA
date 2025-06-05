import os
import shutil

pages_dir = "src/ui/pages"
legacy_dir = "src/ui/pages_legacy"
os.makedirs(legacy_dir, exist_ok=True)

moved = []

for f in os.listdir(pages_dir):
    if f.endswith(".py") and (f[0].isdigit() or f.startswith("_")):
        src = os.path.join(pages_dir, f)
        dst = os.path.join(legacy_dir, f)
        shutil.move(src, dst)
        moved.append(f)

print("✅ Moved legacy multipage files:")
for f in moved:
    print("  •", f) 