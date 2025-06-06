from pathlib import Path
import hashlib
import yaml

# Define project root relative to this file's location (src/system/trust.py)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SYSTEM_DIR = PROJECT_ROOT / "runtime/system"
MANIFEST_PATH = SYSTEM_DIR / ".system_manifest.yaml"
MODE_FILE = SYSTEM_DIR / "mode.yaml"

# Ensure the system directory for mode file etc., exists when the module is loaded
SYSTEM_DIR.mkdir(parents=True, exist_ok=True)

def get_execution_mode():
    if MODE_FILE.exists():
        try:
            with open(MODE_FILE, "r") as f:
                data = yaml.safe_load(f)
                # Handle empty or malformed yaml
                return data.get("execution_mode", "droplet") if isinstance(data, dict) else "droplet"
        except yaml.YAMLError:
            # In case of malformed YAML, default to 'droplet'
            return "droplet"
    return "droplet" # Default if file doesn't exist

def set_execution_mode(mode: str):
    assert mode in ["droplet", "local", "both"], f"Invalid execution mode: {mode}"
    with open(MODE_FILE, "w") as f:
        yaml.dump({"execution_mode": mode}, f)

def hash_file_content(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()

def safe_write(path: str | Path, content: str, trust_enforced: bool = False):
    current_mode = get_execution_mode()
    
    path_str = str(path) # Use the path as provided for the check

    if current_mode == "droplet" and not path_str.startswith("/root/"):
        # This check is specific to the user's "/root/" paths.
        # In a general context, this might use project relative paths or other checks.
        raise RuntimeError(f"Trust enforcement failed: path '{path_str}' not permitted in mode '{current_mode}'")

    file_path_obj = Path(path) 
    file_path_obj.parent.mkdir(parents=True, exist_ok=True)

    pre_hash = hash_file_content(content)
    with open(file_path_obj, "w", encoding="utf-8") as f:
        f.write(content)

    with open(file_path_obj, "r", encoding="utf-8") as f_read:
        read_back_content = f_read.read()
    post_hash = hash_file_content(read_back_content)

    assert pre_hash == post_hash, \
        f"Hash mismatch after writing to {file_path_obj}. Expected {pre_hash}, got {post_hash}."

    if trust_enforced:
        # The user's script prints this, so we replicate it.
        # In a real scenario, this might go to a logger or a more structured audit trail.
        print(f"✅ Trusted write to {file_path_obj} [SHA256: {post_hash}]")

def checkpoint(tag: str):
    """
    Placeholder checkpoint decorator.
    (Optional, if checkpoint decorator is installed later)
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            # In a real implementation, this would integrate with a logging/auditing system.
            print(f"INFO: Checkpoint '{tag}' triggered before calling {func.__name__}")
            result = func(*args, **kwargs)
            print(f"INFO: Checkpoint '{tag}' completed after {func.__name__}")
            return result
        return wrapper
    return decorator

# Initialize mode to 'droplet' when this module is loaded, as per user's script.
set_execution_mode("droplet")
# Print message indicating the trust layer is active.
# This mimics the user's original script's output.
print(f"🔐 Trust layer installed via src.system.trust. Execution mode: {get_execution_mode()}.") 