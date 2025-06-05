import yaml
import hashlib
from pathlib import Path
import sys

def calculate_sha1(filepath):
    """Calculates the SHA-1 hash of a file."""
    sha1_hash = hashlib.sha1()
    try:
        with open(filepath, "rb") as f:
            # Read and update hash string value in blocks of 4K
            for byte_block in iter(lambda: f.read(4096), b""):
                sha1_hash.update(byte_block)
        return sha1_hash.hexdigest()
    except FileNotFoundError:
        return None
    except Exception as e:
        print(f"Error calculating hash for {filepath}: {e}")
        return None

def main():
    project_root = Path(__file__).resolve().parents[2]
    manifest_path = project_root / ".system_manifest.yaml"
    mismatches_found = False

    if not manifest_path.exists():
        print(f"Error: Manifest file not found at {manifest_path}")
        sys.exit(1)

    try:
        with open(manifest_path, 'r') as f:
            manifest_data = yaml.safe_load(f)
    except Exception as e:
        print(f"Error loading manifest YAML: {e}")
        sys.exit(1)

    if not manifest_data:
        print("Manifest is empty or invalid.")
        sys.exit(0)

    print("🔍 Validating manifest SHA-1 hashes...")
    for entry in manifest_data:
        if entry.get('confirmed') is True and 'hash' in entry and entry['hash'] is not None:
            file_path_str = entry.get('path')
            if not file_path_str:
                print(f"Skipping entry with no path: {entry.get('summary', '<no summary>')}")
                continue
            
            # Paths in manifest are relative to project root
            file_to_check = project_root / file_path_str
            recorded_hash = entry['hash']
            
            if not file_to_check.exists():
                if file_to_check.is_dir() and file_path_str.endswith('/'): # Allow directory entries with null hash
                    if recorded_hash is None or recorded_hash == 'null':
                         print(f"  Directory: {file_path_str} (hash not applicable)")
                         continue
                print(f"  Path: {file_path_str}")
                print(f"  Status: FILE_NOT_FOUND")
                mismatches_found = True
                continue
            
            # Skip hash check for directories if hash is null (as per user's YAML)
            if file_to_check.is_dir():
                if recorded_hash is None or recorded_hash == 'null':
                    print(f"  Directory: {file_path_str} (hash not applicable)")
                    continue
                else:
                    print(f"  Path: {file_path_str} (Directory with unexpected hash value)")
                    print(f"  Expected: {recorded_hash}")
                    print(f"  Actual: N/A (Directory)")
                    print(f"  Status: MISMATCH")
                    mismatches_found = True
                    continue

            actual_hash = calculate_sha1(file_to_check)

            if actual_hash is None:
                # Error already printed by calculate_sha1 or file not found
                mismatches_found = True
                continue

            if actual_hash != recorded_hash:
                print(f"  Path: {file_path_str}")
                print(f"  Expected SHA-1: {recorded_hash}")
                print(f"  Actual SHA-1:   {actual_hash}")
                print(f"  Status: MISMATCH")
                mismatches_found = True
            else:
                print(f"  Path: {file_path_str} - ✅ MATCH")

    if mismatches_found:
        print("\n❌ Some file SHA-1 hashes do not match the manifest or files are missing.")
        sys.exit(1)
    else:
        print("\n✅ All file SHA-1 hashes match.")
        sys.exit(0)

if __name__ == "__main__":
    main() 