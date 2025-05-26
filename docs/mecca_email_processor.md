# Mecca Email Processor: Architecture & Source

## Overview

The `process_mecca_emails.py` script is a modular, idempotent email signal processor for the "Mecca" program in Ailo's EA system. It reads email data from a JSON file, classifies relevant Mecca-related emails, and updates a loop markdown file under the "Event Coordination" project. The script is designed for repeated, safe runs and clean integration with markdown-based loop memory.

## Architecture & Logic

### Key Features
- **Idempotency:** Tracks processed email IDs in `emails/processed_email_ids.json` and skips them on future runs.
- **YAML Frontmatter Management:**
  - Writes YAML frontmatter only once (if the loop file doesn't exist).
  - Appends new sender emails to `contacts:` and new email IDs to `source_email_ids:` (no duplicates).
  - Uses `pyyaml` to parse and validate the YAML block.
- **Markdown Loop Content:**
  - Appends a new "📩 Source Signals" section for each new email.
  - Adds a single "### ✅ Tasks" section, and only appends new tasks if not already present.
- **Modular Functions:**
  - `load_emails()` — Loads emails from JSON.
  - `is_mecca_email(email)` — Classifies if an email is relevant to Mecca.
  - `read_loop_file()` — Reads and parses the loop markdown file, extracting YAML and body.
  - `write_loop_file(yaml_dict, body)` — Writes the updated YAML and markdown body back to the loop file.
  - `update_yaml_frontmatter(yaml_dict, email)` — Updates YAML with new contacts and email IDs.
  - `append_signal_and_tasks(body, email, task)` — Appends new signals and tasks to the markdown body.
  - `track_processed_ids(new_ids=None)` — Loads and updates the set of processed email IDs.

### Processing Flow
1. **Load emails** from the JSON file.
2. **Load processed email IDs** to ensure idempotency.
3. **Read the loop file** (if it exists) and parse YAML frontmatter and markdown body.
4. For each unprocessed, Mecca-related email:
    - Update YAML frontmatter with new contacts and email IDs.
    - Append a new "📩 Source Signals" section.
    - If the email indicates an action, append a new task (if not already present).
5. **Write the updated YAML and markdown** back to the loop file.
6. **Update the processed email IDs log.**

---

## Full Source Code

```python
import os
import json
from pathlib import Path
import re
import yaml
from typing import List, Set

EMAILS_PATH = 'emails/sample_mecca_emails.json'
PROCESSED_IDS_PATH = 'emails/processed_email_ids.json'
LOOP_PATH = 'vault/02 Workstreams/Programs/Mecca/loop-2025-06-04-mecca-event_coordination.md'

def ensure_dir(path):
    Path(path).mkdir(parents=True, exist_ok=True)

def load_emails(path=EMAILS_PATH):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def is_mecca_email(email):
    sender = email.get('from', '').lower()
    subject = email.get('subject', '').lower()
    body = email.get('body', '').lower()
    if not sender.endswith('@mecca.com.au'):
        return False
    triggers = ['rsvp', 'event', 'creative']
    return any(t in subject or t in body for t in triggers)

def track_processed_ids(new_ids=None, path=PROCESSED_IDS_PATH):
    ensure_dir(os.path.dirname(path))
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            try:
                ids = set(json.load(f))
            except Exception:
                ids = set()
    else:
        ids = set()
    if new_ids:
        ids.update(new_ids)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(sorted(list(ids)), f, indent=2)
    return ids

def read_loop_file(path=LOOP_PATH):
    if not os.path.exists(path):
        return {}, ''
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    yaml_match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    yaml_block = yaml_match.group(1) if yaml_match else ''
    yaml_dict = yaml.safe_load(yaml_block) if yaml_block else {}
    rest = content[yaml_match.end():] if yaml_match else content
    return yaml_dict, rest

def write_loop_file(yaml_dict, body, path=LOOP_PATH):
    ensure_dir(os.path.dirname(path))
    yaml_str = yaml.safe_dump(yaml_dict, sort_keys=False, allow_unicode=True).strip()
    with open(path, 'w', encoding='utf-8') as f:
        f.write(f"---\n{yaml_str}\n---\n{body.strip()}\n")

def update_yaml_frontmatter(yaml_dict, email):
    # Ensure required fields
    yaml_dict.setdefault('program', 'Mecca')
    yaml_dict.setdefault('project', 'Event Coordination')
    yaml_dict.setdefault('contacts', [])
    yaml_dict.setdefault('source_email_ids', [])
    # Add sender to contacts if new
    sender = email.get('from')
    if sender and sender not in yaml_dict['contacts']:
        yaml_dict['contacts'].append(sender)
    # Add email id to source_email_ids if new
    eid = email.get('id')
    if eid and eid not in yaml_dict['source_email_ids']:
        yaml_dict['source_email_ids'].append(eid)
    return yaml_dict

def append_signal_and_tasks(body, email, task=None):
    # Append new signal
    subject = email.get('subject', '').strip()
    body_text = email.get('body', '').strip()
    trimmed_body = (body_text[:500] + '...') if len(body_text) > 500 else body_text
    signal_md = f"\n## 📩 Source Signals\n- **Subject:** {subject}\n- **Body:** {trimmed_body}\n"
    new_body = body + signal_md
    # Tasks section
    if task:
        if '### ✅ Tasks' not in new_body:
            new_body += '\n### ✅ Tasks\n'
        # Only add task if not present
        if task not in new_body:
            new_body += f'{task}\n'
    return new_body

def extract_task(email):
    subject = email.get('subject', '').lower()
    body = email.get('body', '').lower()
    if 'rsvp' in subject or 'rsvp' in body:
        if 'not received' in body or 'missing' in body or 'reminder' in body:
            return '- [ ] Follow up on missing RSVP'
    if 'approve' in subject or 'approval' in body:
        return '- [ ] Review and approve artwork'
    if 'action' in subject or 'please' in body:
        return '- [ ] Action required: ' + (email.get('subject', '') or 'Check email')
    return None

def process_emails():
    emails = load_emails()
    processed_ids = track_processed_ids()
    yaml_dict, body = read_loop_file()
    new_ids = set()
    for email in emails:
        eid = email.get('id')
        if not eid or eid in processed_ids:
            continue
        if not is_mecca_email(email):
            continue
        # Update YAML frontmatter
        yaml_dict = update_yaml_frontmatter(yaml_dict, email)
        # Extract and append signal and task
        task = extract_task(email)
        body = append_signal_and_tasks(body, email, task)
        new_ids.add(eid)
    write_loop_file(yaml_dict, body)
    track_processed_ids(new_ids)
    print(f"Processed Mecca emails and updated loop file at: {LOOP_PATH}")

if __name__ == '__main__':
    process_emails() 