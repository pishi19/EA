import sqlite3
import json
from pathlib import Path
from datetime import datetime
from urllib.parse import quote

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
            f"{l[0]} — {l[1]} [{l[2]}]\n📄 Source: {obsidian_link(l[3])}\n🕒 Created: {l[4]}"
            for l in loops
        ])

def get_mcp_context_by_status(status="open", limit=5):
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, summary, status, source, created FROM loops WHERE status = ? ORDER BY created DESC LIMIT ?", (status, limit))
        loops = cursor.fetchall()
        return "\n\n".join([
            f"{l[0]} — {l[1]} [{l[2]}]\n📄 Source: {obsidian_link(l[3])}\n🕒 Created: {l[4]}"
            for l in loops
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
    print("📋 Open Loops:")
    print(get_mcp_context())

    print("\n📋 Closed Loops:")
    print(get_mcp_context_by_status("closed"))

    print("\n📋 Loops with #delegation:")
    print(get_mcp_context_by_tag("#delegation"))
