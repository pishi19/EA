#!/usr/bin/env python3
"""
Restore Qdrant persistent data directory from a backup tar.gz file, inside repo.
Caution: this will OVERWRITE your current Qdrant data if present.
"""
import os
import tarfile
from pathlib import Path

QDRANT_STORAGE = Path("./qdrant_data").resolve()
BACKUP_DIR = Path("./qdrant_backups").resolve()

def list_backups():
    backups = sorted(BACKUP_DIR.glob("qdrant_backup_*.tar.gz"), reverse=True)
    for i, backup in enumerate(backups):
        print(f"[{i}] {backup}")
    return backups

def restore_backup(backup_index=0):
    backups = list_backups()
    if not backups:
        print("❌ No Qdrant backup archives found!")
        return
    try:
        file_to_restore = backups[backup_index]
    except IndexError:
        print(f"❌ No backup at index {backup_index}")
        return
    if QDRANT_STORAGE.exists():
        print(f"⚠️  Removing existing Qdrant storage at {QDRANT_STORAGE}")
        for item in QDRANT_STORAGE.iterdir():
            if item.is_dir():
                for sub in item.rglob('*'):
                    if sub.is_file():
                        sub.unlink(missing_ok=True)
                item.rmdir()
            else:
                item.unlink(missing_ok=True)
    else:
        QDRANT_STORAGE.mkdir(parents=True, exist_ok=True)
    with tarfile.open(file_to_restore, "r:gz") as tar:
        tar.extractall(QDRANT_STORAGE.parent)
    print(f"✅ Qdrant storage restored from: {file_to_restore}")

if __name__ == "__main__":
    list_backups()
    idx = input("Enter index of backup to restore (default 0 for latest): ")
    idx = int(idx.strip()) if idx.strip() else 0
    restore_backup(idx)
