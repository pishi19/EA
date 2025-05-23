import shutil
from pathlib import Path

# Define the path to the processed_threads.json file
thread_cache = Path.home() / "ea_assistant" / "gmail" / "processed_threads.json"
backup_cache = Path.home() / "ea_assistant" / "gmail" / "processed_threads_backup.json"


def backup_and_clear_cache():
    if thread_cache.exists():
        print(f"🔁 Backing up: {thread_cache}")
        shutil.move(thread_cache, backup_cache)
        print(f"✅ Moved to: {backup_cache}")
    else:
        print("ℹ️ No processed_threads.json found — nothing to clear.")


if __name__ == "__main__":
    backup_and_clear_cache()
