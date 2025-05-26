import os
import json
from pathlib import Path
import logging
from loop_markdown import LoopMarkdown

EMAILS_PATH = 'emails/sample_mecca_emails.json'
PROCESSED_IDS_PATH = 'emails/processed_email_ids.json'
LOOP_PATH = 'vault/02 Workstreams/Programs/Mecca/loop-2025-06-04-mecca-event_coordination.md'

logging.basicConfig(level=logging.INFO)

def ensure_dir(path):
    Path(path).mkdir(parents=True, exist_ok=True)

def load_emails(path):
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

def extract_task(email):
    subject = email.get('subject', '').lower()
    body = email.get('body', '').lower()
    # Prioritize artwork approval if 'approve' or 'approval' is present
    if 'approve' in subject or 'approval' in body or 'approve' in body or 'approval' in subject:
        return '- [ ] Review and approve artwork'
    if 'rsvp' in subject or 'rsvp' in body:
        if 'not received' in body or 'missing' in body or 'reminder' in body:
            return '- [ ] Follow up on missing RSVP'
    if 'action' in subject or 'please' in body:
        return '- [ ] Action required: ' + (email.get('subject', '') or 'Check email')
    return None

def update_yaml_frontmatter(yaml_dict, email):
    yaml_dict.setdefault('program', 'Mecca')
    yaml_dict.setdefault('project', 'Event Coordination')
    yaml_dict.setdefault('contacts', [])
    yaml_dict.setdefault('source_email_ids', [])
    sender = email.get('from')
    if sender and sender not in yaml_dict['contacts']:
        yaml_dict['contacts'].append(sender)
    eid = email.get('id')
    if eid and eid not in yaml_dict['source_email_ids']:
        yaml_dict['source_email_ids'].append(eid)
    return yaml_dict

def read_loop_file(path):
    if not os.path.exists(path):
        return LoopMarkdown()
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    return LoopMarkdown.parse(content)

def write_loop_file(loop_md, path):
    ensure_dir(os.path.dirname(path))
    with open(path, 'w', encoding='utf-8') as f:
        f.write(loop_md.render())

def process_emails(emails_path=EMAILS_PATH, processed_ids_path=PROCESSED_IDS_PATH, loop_path=LOOP_PATH):
    emails = load_emails(emails_path)
    processed_ids = track_processed_ids(path=processed_ids_path)
    loop_md = read_loop_file(loop_path)
    new_ids = set()
    for email in emails:
        eid = email.get('id')
        if not eid or eid in processed_ids:
            continue
        if not is_mecca_email(email):
            continue
        # Update YAML frontmatter
        loop_md.yaml_dict = update_yaml_frontmatter(loop_md.yaml_dict, email)
        # Add signal
        subject = email.get('subject', '').strip() if email.get('subject') else ''
        body = email.get('body', '').strip() if email.get('body') else ''
        loop_md.add_signal(subject, body)
        # Add task if present
        task = extract_task(email)
        loop_md.add_task(task)
        new_ids.add(eid)
    write_loop_file(loop_md, loop_path)
    track_processed_ids(new_ids, path=processed_ids_path)
    logging.info(f"Processed Mecca emails and updated loop file at: {loop_path}")

if __name__ == '__main__':
    process_emails() 