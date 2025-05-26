import unittest
import os
import shutil
import tempfile
import json
from datetime import datetime
from route_email_signals import process_emails, slugify, load_emails
from classifiers.program_classifier import ProgramClassifier
from loop_markdown import LoopMarkdown

class TestMultiProgramRouting(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.emails_path = os.path.join(self.test_dir, '..', 'data', 'test_mixed_program_emails.json')
        self.processed_ids_path = os.path.join(self.test_dir, 'emails', 'test_processed_email_ids.json')
        self.vault_dir = os.path.join(self.test_dir, 'vault')
        self.config_dir = 'config/programs/'  # Use real configs
        os.makedirs(os.path.dirname(self.emails_path), exist_ok=True)
        os.makedirs(self.vault_dir, exist_ok=True)
        # Sample emails for all three programs, plus an ambiguous one
        self.emails = [
            {
                'id': '1',
                'from': 'sarah.lee@retail.ailo.com',
                'subject': 'Store Opening in Sydney - Please confirm details',
                'date': '2025-07-01',
                'body': 'We are planning a new store opening. Please confirm the site visit schedule.',
                'has_attachment': False
            },
            {
                'id': '2',
                'from': 'priya.patel@crm.ailo.com',
                'subject': 'Migration Update - Urgent Action Required',
                'date': '2025-07-02',
                'body': 'The migration is on track. Please review the attached data import report.',
                'has_attachment': True
            },
            {
                'id': '3',
                'from': 'emily.zhang@partners.ailo.com',
                'subject': 'Enablement Session for New Partners',
                'date': '2025-07-03',
                'body': 'Enablement session scheduled. Confirm your attendance.',
                'has_attachment': False
            },
            {
                'id': '4',
                'from': 'tom.nguyen@expansion.ailo.com',
                'subject': 'Market Research - Review findings',
                'date': '2025-07-04',
                'body': 'Please review the attached market research findings for the new market.',
                'has_attachment': True
            },
            {
                'id': '5',
                'from': 'james.carter@tech.ailo.com',
                'subject': 'Integration Testing and Site Visit',
                'date': '2025-07-05',
                'body': 'This message covers both integration testing and a site visit. Please confirm participation.',
                'has_attachment': False
            },
            {
                'id': '6',
                'from': 'ambiguous.sender@crm.ailo.com',
                'subject': 'Enablement Session and Migration',
                'date': '2025-07-06',
                'body': 'Enablement session and migration for new partners. Please review and confirm.',
                'has_attachment': True
            }
        ]
        with open(self.emails_path, 'w', encoding='utf-8') as f:
            json.dump(self.emails, f)

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_routing_and_idempotency(self):
        classifier = ProgramClassifier(self.config_dir)
        process_emails(
            emails_path=self.emails_path,
            processed_ids_path=self.processed_ids_path,
            config_dir=self.config_dir,
            vault_root=self.vault_dir
        )
        emails = load_emails(self.emails_path)
        for email in emails:
            prog, proj, confidence, matched_fields, ambiguous, ambiguous_programs, ambiguous_projects = classifier.classify(email)
            self.assertIsNotNone(prog, f"No program matched for {email['from']}")
            self.assertIsNotNone(proj, f"No project matched for {email['subject']}")
            program_slug = slugify(prog['program'])
            project_slug = slugify(proj)
            date = email.get('date') or datetime.now().strftime('%Y-%m-%d')
            loop_path = os.path.join(
                self.vault_dir,
                f"{program_slug}/loop-{date}-{program_slug}-{project_slug}.md"
            )
            print(f"Email '{email['subject']}' routed to program '{prog['program']}', project '{proj}', loop file: {loop_path}")
            print(f"  Confidence: {confidence:.2f}, Matched fields: {matched_fields}, Ambiguous: {ambiguous}")
            if os.path.exists(loop_path):
                with open(loop_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                loop_md = LoopMarkdown.parse(content)
                priority = loop_md.yaml_dict.get('priority')
                print(f"  Priority: {priority}")
                self.assertIn(priority, ('high', 'medium', 'low'))
                # Check ambiguity structure for ambiguous email
                if email['id'] == '6':
                    self.assertTrue(loop_md.yaml_dict.get('ambiguity'))
                    self.assertTrue(loop_md.yaml_dict.get('ambiguous_programs'))
                    self.assertTrue(loop_md.yaml_dict.get('ambiguous_projects'))
                    print(f"  Ambiguous programs: {loop_md.yaml_dict.get('ambiguous_programs')}")
                    print(f"  Ambiguous projects: {loop_md.yaml_dict.get('ambiguous_projects')}")
                    # Check signal tag
                    found_tag = any('#review' in sig['subject'] or 'Ambiguity detected' in sig['subject'] for sig in loop_md.signals)
                    self.assertTrue(found_tag)
            self.assertGreater(confidence, 0.0)
        # Second run: should not reprocess any emails
        with open(self.emails_path, 'r', encoding='utf-8') as f:
            emails_before = json.load(f)
        process_emails(
            emails_path=self.emails_path,
            processed_ids_path=self.processed_ids_path,
            config_dir=self.config_dir,
            vault_root=self.vault_dir
        )
        with open(self.processed_ids_path, 'r', encoding='utf-8') as f:
            processed_ids = set(json.load(f))
        self.assertEqual(processed_ids, set(email['id'] for email in self.emails))

if __name__ == '__main__':
    unittest.main() 