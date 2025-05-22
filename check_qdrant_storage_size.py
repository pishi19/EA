#!/usr/bin/env python3
"""
Check the size of ./qdrant_data and prompt to move to cloud if it exceeds a threshold.
"""
import sys
from pathlib import Path

QDRANT_STORAGE = Path("./qdrant_data").resolve()
THRESHOLD_MB = 100  # You can raise this to 500 or 1000 for serious use

def get_dir_size_mb(directory: Path) -> float:
    return sum(f.stat().st_size for f in directory.rglob('*') if f.is_file()) / 1e6

def main():
    if not QDRANT_STORAGE.exists():
        print(f"Qdrant storage directory missing: {QDRANT_STORAGE}")
        sys.exit(0)
    size_mb = get_dir_size_mb(QDRANT_STORAGE)
    print(f"Qdrant storage size: {size_mb:.2f} MB")
    if size_mb > THRESHOLD_MB:
        print("🚨 Qdrant vector DB is large!")
        print(f"Qdrant storage {QDRANT_STORAGE} exceeds {THRESHOLD_MB}MB.")
        print("Consider moving to cloud storage (S3, GDrive, etc) or activating git-lfs if you want to keep version control.")
        print("Ask your EA agent for help automating this move!")

if __name__ == "__main__":
    main()
