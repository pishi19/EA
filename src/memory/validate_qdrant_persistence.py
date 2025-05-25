#!/usr/bin/env python3
"""
Check that Qdrant's persistent storage (inside git repo) is mounted and non-empty.
"""
import sys
from pathlib import Path

QDRANT_STORAGE = Path("./qdrant_data").resolve()


def main():
    if not QDRANT_STORAGE.exists():
        print(f"❌ Qdrant storage directory missing: {QDRANT_STORAGE}")
        sys.exit(1)
    if not any(QDRANT_STORAGE.iterdir()):
        print(f"❌ Qdrant storage ({QDRANT_STORAGE}) appears empty — check your Docker mount!")
        sys.exit(1)
    print(f"✅ Qdrant persistence validated at {QDRANT_STORAGE}")


if __name__ == "__main__":
    main()
