import os
import json
import logging
from pathlib import Path
from classifiers.program_classifier import ProgramClassifier
from loop_markdown import LoopMarkdown
from datetime import datetime
import re
import argparse

def ensure_dir(path):
    Path(path).mkdir(parents=True, exist_ok=True)

def load_emails(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def track_processed_ids(new_ids=None, path=None):
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

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

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

def calculate_priority(email):
    subject = (email.get('subject') or '').lower()
    body = (email.get('body') or '').lower()
    task_verbs = ["please", "confirm", "approve", "review", "urgent", "action"]
    urgency_keywords = ["asap", "immediately", "critical"]
    verb_count = sum(1 for v in task_verbs if v in subject or v in body)
    urgency = any(u in subject for u in urgency_keywords)
    has_attachment = email.get("has_attachment", False)
    recipient_count = 0
    for field in ["to", "cc", "bcc"]:
        val = email.get(field)
        if isinstance(val, list):
            recipient_count += len(val)
        elif val:
            recipient_count += 1
    # Priority rules
    if urgency or verb_count >= 2:
        return "high"
    if verb_count == 1 or has_attachment:
        return "medium"
    if recipient_count > 2:
        return "low"
    return "low"

def update_yaml_frontmatter(yaml_dict, email, program, project, confidence, matched_fields, ambiguous, priority, ambiguous_programs=None, ambiguous_projects=None):
    yaml_dict.setdefault('program', program['program'])
    yaml_dict.setdefault('area', program.get('area', ''))
    yaml_dict.setdefault('project', project)
    yaml_dict.setdefault('contacts', [])
    yaml_dict.setdefault('source_email_ids', [])
    yaml_dict['confidence'] = confidence
    yaml_dict['ambiguity'] = ambiguous
    yaml_dict['matched_fields'] = matched_fields
    yaml_dict['priority'] = priority
    if ambiguous:
        yaml_dict['ambiguous_programs'] = ambiguous_programs or []
        yaml_dict['ambiguous_projects'] = ambiguous_projects or []
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

def format_signal_blockquote(email, ambiguous=False):
    subject = email.get('subject', '').strip()
    body_text = email.get('body', '').strip()
    trimmed_body = (body_text[:500] + '...') if len(body_text) > 500 else body_text
    tag = " #review ⚠️ Ambiguity detected" if ambiguous else ""
    return f'\n> **Subject:** {subject}{tag}  \n> **Body:** {trimmed_body}\n'

def process_emails(
    emails_path='emails/sample_mecca_emails.json',
    processed_ids_path='emails/processed_email_ids.json',
    config_dir='config/programs/',
    vault_root='vault/02 Workstreams/Programs/'
):
    logging.basicConfig(level=logging.INFO)
    emails = load_emails(emails_path)
    processed_ids = track_processed_ids(path=processed_ids_path)
    classifier = ProgramClassifier(config_dir)
    new_ids = set()
    loop_files = {}
    for email in emails:
        eid = email.get('id')
        if not eid or eid in processed_ids:
            continue
        program, project, confidence, matched_fields, ambiguous, ambiguous_programs, ambiguous_projects = classifier.classify(email)
        if not program or not project:
            continue
        priority = calculate_priority(email)
        # Route to correct loop file
        date = email.get('date') or datetime.now().strftime('%Y-%m-%d')
        program_folder = program['program']  # Use exact name, with spaces/capitals
        project_slug = slugify(project)
        program_dir = os.path.join(vault_root, program_folder)
        ensure_dir(program_dir)
        loop_path = os.path.join(program_dir, f'loop-{date}-{project_slug}.md')
        if loop_path not in loop_files:
            loop_files[loop_path] = read_loop_file(loop_path)
        loop_md = loop_files[loop_path]
        # Update YAML frontmatter
        loop_md.yaml_dict = update_yaml_frontmatter(
            loop_md.yaml_dict, email, program, project, confidence, matched_fields, ambiguous, priority, ambiguous_programs, ambiguous_projects
        )
        # Add signal
        loop_md.add_signal(
            email.get('subject', '').strip() if email.get('subject') else '',
            email.get('body', '').strip() if email.get('body') else ''
        )
        # If ambiguous, tag the last signal
        if ambiguous and loop_md.signals:
            last_signal = loop_md.signals.pop()
            loop_md.signals.append({'subject': last_signal['subject'] + ' #review ⚠️ Ambiguity detected', 'body': last_signal['body']})
        # Add task if present
        task = extract_task(email)
        loop_md.add_task(task)
        new_ids.add(eid)
    # Write all loop files
    for loop_path, loop_md in loop_files.items():
        write_loop_file(loop_md, loop_path)
    track_processed_ids(new_ids, path=processed_ids_path)
    logging.info(f"Processed emails and updated {len(loop_files)} loop files.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Process and classify emails for multiple programs.')
    parser.add_argument('--emails_path', type=str, default='emails/sample_mecca_emails.json', help='Path to input email JSON file')
    parser.add_argument('--processed_ids_path', type=str, default='emails/processed_email_ids.json', help='Path to processed email IDs log')
    parser.add_argument('--programs_dir', type=str, default='config/programs/', help='Path to programs YAML config directory')
    parser.add_argument('--vault_root', type=str, default='vault/02 Workstreams/Programs/', help='Path to loop file vault root')
    args = parser.parse_args()
    process_emails(
        emails_path=args.emails_path,
        processed_ids_path=args.processed_ids_path,
        config_dir=args.programs_dir,
        vault_root=args.vault_root
    ) 