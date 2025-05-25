#!/usr/bin/env python3
"""
Backup Qdrant persistent data directory located inside the git repo.
Simply makes a timestamped tar.gz copy of ./qdrant_data folder.
"""
import tarfile
from datetime import datetime
from pathlib import Path

QDRANT_STORAGE = Path("./qdrant_data").resolve()
BACKUP_DIR = Path("./qdrant_backups").resolve()
BACKUP_DIR.mkdir(exist_ok=True)


def make_backup():
    if not QDRANT_STORAGE.exists() or not any(QDRANT_STORAGE.iterdir()):
        print(f"❌ Qdrant storage not found or empty at {QDRANT_STORAGE}")
        return
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_file = BACKUP_DIR / f"qdrant_backup_{timestamp}.tar.gz"
    with tarfile.open(backup_file, "w:gz") as tar:
        tar.add(QDRANT_STORAGE, arcname="qdrant_data")
    print(f"✅ Qdrant backup created: {backup_file}")


if __name__ == "__main__":
    make_backup()
