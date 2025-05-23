import json
import sqlite3
from pathlib import Path
from urllib.parse import quote
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DB_PATH = Path("/Users/air/ea_assistant/mcp_server/loops/mcp_memory.db")
VAULT_NAME = "AIR01"

def obsidian_link(source_path):
    file_path = source_path.replace("obsidian:/", "")
    encoded_path = quote(file_path)
    filename = file_path.split("/")[-1].replace(".md", "")
    return f"[{filename}](obsidian://open?vault={VAULT_NAME}&file={encoded_path})"

def get_mcp_context(limit=5):
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, summary, status, source, created FROM loops WHERE status = 'open' ORDER BY created DESC LIMIT ?", (limit,))
        loops = cursor.fetchall()
        return "\n\n".join([
            f"{loop[0]} — {loop[1]} [{loop[2]}]\n📄 Source: {obsidian_link(loop[3])}\n🕒 Created: {loop[4]}"
            for loop in loops
        ])

def get_mcp_context_by_status(status="open", limit=5):
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, summary, status, source, created FROM loops WHERE status = ? ORDER BY created DESC LIMIT ?", (status, limit))
        loops = cursor.fetchall()
        return "\n\n".join([
            f"{loop[0]} — {loop[1]} [{loop[2]}]\n📄 Source: {obsidian_link(loop[3])}\n🕒 Created: {loop[4]}"
            for loop in loops
        ])

def get_mcp_context_by_tag(tag="#loop", limit=5):
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, summary, status, tags, source, created FROM loops ORDER BY created DESC")
        loops = []
        for row in cursor.fetchall():
            tags = json.loads(row[3])
            if tag in tags:
                loops.append(f"{row[0]} — {row[1]} [{row[2]}]\n📄 Source: {obsidian_link(row[4])}\n🕒 Created: {row[5]}")
        return "\n\n".join(loops[:limit])

if __name__ == "__main__":
    logger.info("📋 Open Loops:")
    print(get_mcp_context())

    logger.info("\n📋 Closed Loops:")
    print(get_mcp_context_by_status("closed"))

    logger.info("\n📋 Loops with #delegation:")
    print(get_mcp_context_by_tag("#delegation"))
