import os
from datetime import datetime
from pathlib import Path

VAULT_PATH = "/Users/air/AIR01"
ASSISTANT_NOTE_DIR = os.path.join(VAULT_PATH, "0001 HQ/Daily Assistant")
RETRO_DIR = os.path.join(VAULT_PATH, "Retrospectives")
VISION_LINK = "[[System/Reference/EA-Vision]]"

today = datetime.now().strftime("%Y-%m-%d")
loop_id = f"loop-{today}-assistant"
assistant_note_path = os.path.join(ASSISTANT_NOTE_DIR, f"{today}-assistant.md")
loop_path = os.path.join(RETRO_DIR, f"{loop_id}.md")
feedback_link = f"[[Reports/Feedback/Daily/{today}]]"

# Ensure directories exist
Path(ASSISTANT_NOTE_DIR).mkdir(parents=True, exist_ok=True)
Path(RETRO_DIR).mkdir(parents=True, exist_ok=True)

# Write the assistant daily note
with open(assistant_note_path, "w", encoding="utf-8") as f:
    f.write(f"# 🧠 Assistant Daily Note — {today}\n\n")
    f.write("## 📬 Feedback Summary\n")
    f.write(f"→ {feedback_link}\n\n")

    f.write("## 🎯 System Vision Snapshot\n\n")
    f.write(f"→ {VISION_LINK}\n\n")

    f.write("<details>\n<summary>✅ What’s Working</summary>\n\n")
    f.write("- Gmail signal ingestion & triage  \n")
    f.write("- Archival pipeline with `[x]` + `threadId`  \n")
    f.write("- Feedback tagging and log generation  \n")
    f.write("- Daily/weekly/monthly report automation  \n")
    f.write("- Assistant daily note with feedback linkage  \n")
    f.write("- Launchd automation for both pipelines  \n")
    f.write("</details>\n\n")

    f.write("<details>\n<summary>🚧 What’s Missing / Upcoming</summary>\n\n")
    f.write("- Loop memory feedback ingestion  \n")
    f.write("- Signal classification and semantic scoring  \n")
    f.write("- Project/Program routing for tasks  \n")
    f.write("- Cross-source synthesis (Calendar, Messages)  \n")
    f.write("- Assistant reflection on emotional/spiritual state  \n")
    f.write("</details>\n")

# Write the loop memory file with status + verification controls
with open(loop_path, "w", encoding="utf-8") as f:
    f.write("---\n")
    f.write(f"id: {loop_id}\n")
    f.write(f"summary: Assistant system snapshot for {today}\n")
    f.write("status: open\n")
    f.write("type: snapshot\n")
    f.write("topic: system_vision\n")
    f.write("tags: [#loop, #snapshot, #assistant]\n")
    f.write(f"source: obsidian:/0001 HQ/Daily Assistant/{today}-assistant.md\n")
    f.write("verified: false\n")
    f.write("---\n\n")

    f.write("### 🔁 Assistant Daily Snapshot\n")
    f.write(f"This loop captures the assistant system state on {today}.\n")
    f.write("Refer to [[System/Reference/EA-Vision]] for strategic alignment.\n\n")

    f.write("### 🔄 Loop Controls\n\n")
    f.write(f"[✅ Mark loop as closed](shell:python3 ~/ea_assistant/mcp_server/interface/mcp_memory.py status {loop_id} closed)  \n")
    f.write(f"[🔁 Reopen loop](shell:python3 ~/ea_assistant/mcp_server/interface/mcp_memory.py status {loop_id} open)\n\n")

    f.write("### ✅ Verification\n\n")
    f.write(f"[🔏 Mark as verified](shell:python3 ~/ea_assistant/mcp_server/interface/mcp_memory.py verify {loop_id} true)  \n")
    f.write(f"[🔓 Unverify](shell:python3 ~/ea_assistant/mcp_server/interface/mcp_memory.py verify {loop_id} false)\n")

print(f"✅ Assistant note + loop with full control (status + verified) created for {today}")
