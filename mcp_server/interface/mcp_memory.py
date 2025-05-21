import os
import sys
import re

VAULT_PATH = "/Users/air/AIR01/Retrospectives"

def update_status(loop_id, new_status):
    filename = os.path.join(VAULT_PATH, f"{loop_id}.md")
    if not os.path.exists(filename):
        print(f"❌ Loop file not found: {filename}")
        return

    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    updated_content = re.sub(r"(status: )\w+", f"\\1{new_status}", content)

    with open(filename, "w", encoding="utf-8") as f:
        f.write(updated_content)

    print(f"✅ Updated loop {loop_id} status to '{new_status}'")

def update_verified(loop_id, value):
    filename = os.path.join(VAULT_PATH, f"{loop_id}.md")
    if not os.path.exists(filename):
        print(f"❌ Loop file not found: {filename}")
        return

    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()

    updated_content = re.sub(r"(verified: )\w+", f"\\1{value}", content)

    with open(filename, "w", encoding="utf-8") as f:
        f.write(updated_content)

    print(f"✅ Updated loop {loop_id} verified to '{value}'")

if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "status":
        _, loop_id, new_status = sys.argv
        update_status(loop_id, new_status)
    elif len(sys.argv) == 3 and sys.argv[1] == "verify":
        _, loop_id, value = sys.argv
        update_verified(loop_id, value)
    else:
        print("Usage:")
        print("  python3 mcp_memory.py status <loop-id> <open|closed>")
        print("  python3 mcp_memory.py verify <loop-id> <true|false>")
