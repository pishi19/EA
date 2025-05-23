import json
import os
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Paths
json_path = Path("/Users/air/ea_assistant/mcp_server/loops/loop_memory.json")
sync_script = "/Users/air/ea_assistant/mcp_server/interface/sync_loops_to_markdown.py"

# Define a new loop (example)
new_loop = {
    "id": "loop-2025-05-21-01",
    "summary": "System-wide delay in task automation",
    "status": "open",
    "tags": ["#loop", "#systems"],
    "source": "obsidian:/Retrospectives/2025-05-21.md"
}

# Load existing memory
if json_path.exists():
    with open(json_path, "r") as f:
        memory = json.load(f)
else:
    memory = []

# Append only if it's a new loop
if not any(loop["id"] == new_loop["id"] for loop in memory):
    memory.append(new_loop)
    with open(json_path, "w") as f:
        json.dump(memory, f, indent=2)
    logger.info(f"✅ Added new loop: {new_loop['id']}")
else:
    logger.warning(f"⚠️ Loop {new_loop['id']} already exists")

# Trigger sync to markdown
os.system(f"python3 {sync_script}")
