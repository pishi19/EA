import os
import re

from src.path_config import CONFIG_PATH

# Paths to adjust for your local setup
PATCH_DIR = "/Users/air/AIR01/System/GPT_Patches/"


def find_latest_patch():
    files = sorted(
        [f for f in os.listdir(PATCH_DIR) if f.startswith("GPT_Logic_Proposal-")],
        reverse=True,
    )
    return os.path.join(PATCH_DIR, files[0]) if files else None


def load_patch_file(path):
    with open(path) as f:
        return f.read()


def is_patch_approved(block):
    return "- [x] ✅" in block or "- [X] ✅" in block


def apply_patch_to_config(patch_content):
    updated = False

    if "Adjust Task Classification Threshold" in patch_content and is_patch_approved(patch_content):
        threshold_pattern = r"(TASK_CLASSIFICATION_THRESHOLD\s*=\s*)([0-9.]+)"
        new_threshold = re.search(r"Proposed Threshold\*\*: ([0-9.]+)", patch_content)
        if new_threshold:
            new_val = new_threshold.group(1)
            with open(CONFIG_PATH) as f:
                config = f.read()
            config_new = re.sub(threshold_pattern, lambda m: f"{m.group(1)}{new_val}", config)
            with open(CONFIG_PATH, "w") as f:
                f.write(config_new)
            print(f"✅ Updated TASK_CLASSIFICATION_THRESHOLD to {new_val}")
            updated = True

    if "Ignore Noisy Sender" in patch_content and is_patch_approved(patch_content):
        sender_match = re.search(r"Sender\*\*: ([^\n]+)", patch_content)
        if sender_match:
            sender = sender_match.group(1).strip()
            with open(CONFIG_PATH, "a") as f:
                f.write(f"IGNORED_SENDERS.append('{sender}')\n")
            print(f"✅ Added '{sender}' to IGNORED_SENDERS")
            updated = True

    if not updated:
        print("⚠️ No approved patches found or nothing to apply.")


if __name__ == "__main__":
    patch_path = find_latest_patch()
    if patch_path:
        content = load_patch_file(patch_path)
        apply_patch_to_config(content)
    else:
        print("❌ No patch file found.")
