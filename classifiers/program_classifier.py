import os
import yaml
import glob
import re
from collections import defaultdict

def validate_program_configs(config_dir='config/programs/'):
    required_fields = ['program', 'area', 'domains', 'keywords']
    errors = []
    for path in glob.glob(os.path.join(config_dir, '*.yaml')):
        with open(path, 'r', encoding='utf-8') as f:
            try:
                data = yaml.safe_load(f)
            except Exception as e:
                errors.append(f"{path}: YAML parse error: {e}")
                continue
            for field in required_fields:
                if field not in data or not data[field]:
                    errors.append(f"{path}: Missing required field '{field}'")
            if 'projects' in data and not isinstance(data['projects'], list):
                errors.append(f"{path}: 'projects' should be a list")
            if 'contacts' in data:
                if not isinstance(data['contacts'], list):
                    errors.append(f"{path}: 'contacts' should be a list")
                else:
                    for c in data['contacts']:
                        if isinstance(c, dict):
                            if 'email' not in c or 'name' not in c:
                                errors.append(f"{path}: contact dict missing 'name' or 'email'")
                        elif not isinstance(c, str):
                            errors.append(f"{path}: contact should be string or dict")
    if errors:
        for e in errors:
            print(f"[CONFIG VALIDATION ERROR] {e}")
        raise ValueError(f"Program config validation failed with {len(errors)} error(s). See above.")
    else:
        print("All program configs validated successfully.")

class ProgramClassifier:
    def __init__(self, config_dir='config/programs/'):
        validate_program_configs(config_dir)
        self.config_dir = config_dir
        self.programs = self.load_programs()
        self.contact_to_program = self._build_contact_index()

    def load_programs(self):
        programs = []
        for path in glob.glob(os.path.join(self.config_dir, '*.yaml')):
            with open(path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                if data:
                    programs.append(data)
        return programs

    def _build_contact_index(self):
        contact_map = defaultdict(list)
        for prog in self.programs:
            for contact in prog.get('contacts', []):
                if isinstance(contact, dict):
                    contact_email = contact.get('email', '').lower()
                else:
                    contact_email = contact.lower()
                if contact_email:
                    contact_map[contact_email].append(prog)
        return contact_map

    def match_fields(self, program, email):
        sender = email.get('from', '').lower()
        recipients = set()
        for field in ['to', 'cc', 'bcc']:
            val = email.get(field)
            if isinstance(val, list):
                recipients.update([v.lower() for v in val])
            elif val:
                recipients.add(val.lower())
        subject = email.get('subject', '').lower()
        body = email.get('body', '').lower()
        matched_fields = []
        # Contact (from or any recipient)
        for contact in program.get('contacts', []):
            contact_email = contact['email'].lower() if isinstance(contact, dict) else contact.lower()
            if sender == contact_email or contact_email in recipients:
                matched_fields.append('contact')
                break
        # Domain (from or any recipient)
        for domain in program.get('domains', []):
            if sender.endswith(domain.lower()) or any(r.endswith(domain.lower()) for r in recipients):
                matched_fields.append('domain')
                break
        # Keyword
        for keyword in program.get('keywords', []):
            if keyword.lower() in subject or keyword.lower() in body:
                matched_fields.append('keyword')
                break
        # Project trigger
        if 'projects' in program and program['projects']:
            for proj in program['projects']:
                if proj.lower() in subject or proj.lower() in body:
                    matched_fields.append('project_trigger')
                    break
        return matched_fields

    def classify(self, email):
        matches = []
        for prog in self.programs:
            matched_fields = self.match_fields(prog, email)
            if matched_fields:
                project = None
                triggered_projects = []
                if 'project_trigger' in matched_fields:
                    for proj in prog.get('projects', []):
                        if proj.lower() in email.get('subject', '').lower() or proj.lower() in email.get('body', '').lower():
                            triggered_projects.append(proj)
                    if triggered_projects:
                        project = triggered_projects[0]
                if not project and 'keyword' in matched_fields:
                    for keyword in prog.get('keywords', []):
                        if keyword.lower() in email.get('subject', '').lower() or keyword.lower() in email.get('body', '').lower():
                            if 'projects' in prog and prog['projects']:
                                for proj in prog['projects']:
                                    if keyword.lower() in proj.lower():
                                        triggered_projects.append(proj)
                                if not triggered_projects:
                                    triggered_projects.append(prog['projects'][0])
                                project = triggered_projects[0]
                            else:
                                triggered_projects.append('General')
                                project = 'General'
                            break
                if not project and 'projects' in prog and prog['projects']:
                    triggered_projects.append(prog['projects'][0])
                    project = prog['projects'][0]
                elif not project:
                    triggered_projects.append('General')
                    project = 'General'
                total_possible = 4  # contact, domain, keyword, project_trigger
                confidence = len(matched_fields) / total_possible
                matches.append({
                    'program': prog,
                    'project': project,
                    'confidence': confidence,
                    'matched_fields': matched_fields,
                    'triggered_projects': triggered_projects
                })
        ambiguous = len(matches) > 1
        ambiguous_programs = [m['program']['program'] for m in matches] if ambiguous else []
        ambiguous_projects = list({proj for m in matches for proj in m.get('triggered_projects', [])}) if ambiguous else []
        if not matches:
            return None, None, 0.0, [], False, [], []
        best = max(matches, key=lambda m: m['confidence'])
        return (
            best['program'],
            best['project'],
            best['confidence'],
            best['matched_fields'],
            ambiguous,
            ambiguous_programs,
            ambiguous_projects
        ) 