import json
import logging
import os
from pathlib import Path
from src.path_config import MCP_MEMORY_JSON

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Define a new loop (example)
new_loop = {
    "id": "loop-2025-05-21-01",
    "summary": "System-wide delay in task automation",
    "status": "open",
    "tags": ["#loop", "#systems"],
    "source": "obsidian:/Retrospectives/2025-05-21.md",
}

# Load existing memory
if MCP_MEMORY_JSON.exists():
    with open(MCP_MEMORY_JSON) as f:
        memory = json.load(f)
else:
    memory = []

# Append only if it's a new loop
if not any(loop["id"] == new_loop["id"] for loop in memory):
    memory.append(new_loop)
    with open(MCP_MEMORY_JSON, "w") as f:
        json.dump(memory, f, indent=2)
    logger.info(f"✅ Added new loop: {new_loop['id']}")
else:
    logger.warning(f"⚠️ Loop {new_loop['id']} already exists")

# Trigger sync to markdown
os.system(f"python3 {MCP_MEMORY_JSON.parent / 'sync_loops_to_markdown.py'}")
