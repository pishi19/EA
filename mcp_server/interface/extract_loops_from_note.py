import json
import os
from pathlib import Path
from datetime import datetime
from openai import OpenAI

# Configuration
retros_dir = Path("/Users/air/AIR01/Retrospectives/")
json_path = Path("/Users/air/ea_assistant/mcp_server/loops/loop_memory.json")
sync_script = "/Users/air/ea_assistant/mcp_server/interface/write_loops_to_files.py"
log_path = Path("/Users/air/ea_assistant/logs/extract_loops.log")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """
You are an assistant that extracts strategic feedback loops from retrospective notes.
Each loop should include:
- A concise summary (1 sentence)
- Tags (start with #)
- A source reference to the Obsidian file
Always return a list of loop dictionaries like:
[
  {
    "summary": "...",
    "tags": ["#loop", "#trust", "#team"],
    "source": "obsidian:/Retrospectives/2025-05-20.md"
  }
]
"""

def find_latest_md_file(folder):
    md_files = list(folder.glob("*.md"))
    if not md_files:
        return None
    return max(md_files, key=lambda f: f.stat().st_mtime)

def extract_loops(text, source_note):
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"File: {source_note}\n\n{text}"}
        ],
        temperature=0.4
    )
    result = response.choices[0].message.content
    print("🧠 GPT RAW RESPONSE:")
    print(result)
    try:
        loops = json.loads(result)
        return loops
    except Exception as e:
        print("❌ Failed to parse GPT output as JSON.")
        return []

def assign_ids(loops, existing_ids, note_date):
    base = f"loop-{note_date}-"
    used_numbers = {
        int(loop_id.split("-")[-1])
        for loop_id in existing_ids
        if loop_id.startswith(base) and loop_id.split("-")[-1].isdigit()
    }

    next_id = 1
    for loop in loops:
        while next_id in used_numbers:
            next_id += 1
        loop["id"] = f"{base}{next_id:02}"
        loop["status"] = "open"
        loop["verified"] = False
        used_numbers.add(next_id)
        next_id += 1

    return loops

def main():
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    latest_note = find_latest_md_file(retros_dir)

    if not latest_note:
        print("❌ No retrospective note found.")
        return

    note_text = latest_note.read_text()
    source_ref = f"obsidian:/Retrospectives/{latest_note.name}"
    note_date = latest_note.stem  # e.g., '2025-05-21'

    loops = extract_loops(note_text, source_ref)
    if not loops:
        print("No loops extracted.")
        return

    if json_path.exists():
        with open(json_path, "r") as f:
            memory = json.load(f)
    else:
        memory = []

    existing_ids = {l["id"] for l in memory if "id" in l}
    loops = assign_ids(loops, existing_ids, note_date)
    new_loops = [l for l in loops if l["id"] not in existing_ids]

    with open(log_path, "a") as log:
        if new_loops:
            memory.extend(new_loops)
            with open(json_path, "w") as f:
                json.dump(memory, f, indent=2)
            log.write(f"[{timestamp}] ✅ {len(new_loops)} new loop(s) added from {latest_note.name}\n")
            os.system(f"python3 {sync_script}")
        else:
            log.write(f"[{timestamp}] No new loops found in {latest_note.name}\n")

if __name__ == "__main__":
    main()
