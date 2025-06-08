import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)


class MemorySystem:
    """Handles data persistence and retrieval for the EA Assistant."""

    def __init__(self, storage_path: str = "data/memory"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.memory_cache: dict[str, Any] = {}

    def store(self, key: str, data: Any) -> bool:
        """Store data in memory system."""
        try:
            # Update cache
            self.memory_cache[key] = {
                "data": data,
                "timestamp": datetime.now().isoformat(),
            }

            # Persist to disk
            file_path = self.storage_path / f"{key}.json"
            with open(file_path, "w") as f:
                json.dump(self.memory_cache[key], f)

            logger.info(f"Stored data for key: {key}")
            return True

        except Exception as e:
            logger.error(f"Error storing data for key {key}: {e!s}")
            return False

    def retrieve(self, key: str) -> Optional[Any]:
        """Retrieve data from memory system."""
        try:
            # Check cache first
            if key in self.memory_cache:
                return self.memory_cache[key]["data"]

            # If not in cache, try to load from disk
            file_path = self.storage_path / f"{key}.json"
            if file_path.exists():
                with open(file_path) as f:
                    data = json.load(f)
                    self.memory_cache[key] = data
                    return data["data"]

            return None

        except Exception as e:
            logger.error(f"Error retrieving data for key {key}: {e!s}")
            return None

    def delete(self, key: str) -> bool:
        """Delete data from memory system."""
        try:
            # Remove from cache
            if key in self.memory_cache:
                del self.memory_cache[key]

            # Remove from disk
            file_path = self.storage_path / f"{key}.json"
            if file_path.exists():
                file_path.unlink()

            logger.info(f"Deleted data for key: {key}")
            return True

        except Exception as e:
            logger.error(f"Error deleting data for key {key}: {e!s}")
            return False

    def list_keys(self) -> list[str]:
        """List all stored keys."""
        try:
            # Get keys from both cache and disk
            cache_keys = set(self.memory_cache.keys())
            disk_keys = {f.stem for f in self.storage_path.glob("*.json")}

            return list(cache_keys.union(disk_keys))

        except Exception as e:
            logger.error(f"Error listing keys: {e!s}")
            return []

    def clear(self) -> bool:
        """Clear all stored data."""
        try:
            # Clear cache
            self.memory_cache.clear()

            # Clear disk storage
            for file_path in self.storage_path.glob("*.json"):
                file_path.unlink()

            logger.info("Cleared all stored data")
            return True

        except Exception as e:
            logger.error(f"Error clearing data: {e!s}")
            return False
