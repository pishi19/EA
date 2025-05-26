import unittest
import os
import shutil
import tempfile
import json
import yaml
from unittest.mock import patch
from process_mecca_emails import (
    is_mecca_email, track_processed_ids, update_yaml_frontmatter,
    extract_task, process_emails
)
from loop_markdown import LoopMarkdown

class TestProcessMeccaEmails(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.emails_path = os.path.join(self.test_dir, 'emails', 'test_sample_mecca_emails.json')
        self.processed_ids_path = os.path.join(self.test_dir, 'emails', 'test_processed_email_ids.json')
        self.loop_path = os.path.join(self.test_dir, 'vault', 'test_mecca_loop.md')
        os.makedirs(os.path.dirname(self.emails_path), exist_ok=True)
        os.makedirs(os.path.dirname(self.loop_path), exist_ok=True)
        self.email1 = {
            'id': '1',
            'from': 'alice@mecca.com.au',
            'subject': 'RSVP Needed',
            'date': '2025-06-01',
            'body': 'RSVP not received for event.'
        }
        self.email2 = {
            'id': '2',
            'from': 'bob@mecca.com.au',
            'subject': 'Creative Approval',
            'date': '2025-06-02',
            'body': 'Please approve the artwork.'
        }
        self.email3 = {
            'id': '3',
            'from': 'carol@other.com',
            'subject': 'FYI',
            'date': '2025-06-03',
            'body': 'No action required.'
        }
        self.email4 = {
            'id': '4',
            'from': 'alice@mecca.com.au',
            'subject': 'Event Update',
            'date': '2025-06-04',
            'body': 'Event details updated.'
        }

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_is_mecca_email(self):
        self.assertTrue(is_mecca_email(self.email1))
        self.assertTrue(is_mecca_email(self.email2))
        self.assertTrue(is_mecca_email(self.email4))
        self.assertFalse(is_mecca_email(self.email3))

    def test_track_processed_ids(self):
        ids = track_processed_ids(path=self.processed_ids_path)
        self.assertEqual(ids, set())
        ids = track_processed_ids({'1', '2'}, path=self.processed_ids_path)
        self.assertEqual(ids, {'1', '2'})
        ids = track_processed_ids({'2', '3'}, path=self.processed_ids_path)
        self.assertEqual(ids, {'1', '2', '3'})
        ids2 = track_processed_ids(path=self.processed_ids_path)
        self.assertEqual(ids2, {'1', '2', '3'})

    def test_update_yaml_frontmatter(self):
        yaml_dict = {}
        yaml_dict = update_yaml_frontmatter(yaml_dict, self.email1)
        self.assertIn('alice@mecca.com.au', yaml_dict['contacts'])
        self.assertIn('1', yaml_dict['source_email_ids'])
        yaml_dict = update_yaml_frontmatter(yaml_dict, self.email2)
        self.assertIn('bob@mecca.com.au', yaml_dict['contacts'])
        self.assertIn('2', yaml_dict['source_email_ids'])
        yaml_dict = update_yaml_frontmatter(yaml_dict, self.email1)
        self.assertEqual(yaml_dict['contacts'].count('alice@mecca.com.au'), 1)
        self.assertEqual(yaml_dict['source_email_ids'].count('1'), 1)

    def test_loop_markdown_signals_and_tasks(self):
        loop_md = LoopMarkdown()
        # Add signals
        loop_md.add_signal(self.email1['subject'], self.email1['body'])
        loop_md.add_signal(self.email2['subject'], self.email2['body'])
        loop_md.add_signal(self.email1['subject'], self.email1['body'])  # duplicate, should not add
        self.assertEqual(len(loop_md.signals), 2)
        # Add tasks
        task1 = '- [ ] Follow up on missing RSVP'
        task2 = '- [ ] Review and approve artwork'
        loop_md.add_task(task1)
        loop_md.add_task(task2)
        loop_md.add_task(task1)  # duplicate, should not add
        self.assertIn(task1, loop_md.tasks)
        self.assertIn(task2, loop_md.tasks)
        self.assertEqual(loop_md.tasks.count(task1), 1)
        self.assertEqual(loop_md.tasks.count(task2), 1)
        # Render and parse round-trip
        rendered = loop_md.render()
        parsed = LoopMarkdown.parse(rendered)
        self.assertEqual(parsed.signals, loop_md.signals)
        self.assertEqual(parsed.tasks, loop_md.tasks)

    def test_read_write_loop_file(self):
        loop_md = LoopMarkdown(
            yaml_dict={'program': 'Mecca', 'project': 'Event Coordination', 'contacts': ['alice@mecca.com.au'], 'source_email_ids': ['1']},
            signals=[{'subject': 'RSVP Needed', 'body': 'RSVP not received for event.'}]
        )
        rendered = loop_md.render()
        with open(self.loop_path, 'w', encoding='utf-8') as f:
            f.write(rendered)
        with open(self.loop_path, 'r', encoding='utf-8') as f:
            content = f.read()
        loaded = LoopMarkdown.parse(content)
        self.assertEqual(loaded.yaml_dict['program'], 'Mecca')
        self.assertIn('alice@mecca.com.au', loaded.yaml_dict['contacts'])
        self.assertEqual(loaded.signals[0]['subject'], 'RSVP Needed')

    def test_integration_full_pipeline(self):
        emails = [self.email1, self.email2, self.email3, self.email4]
        with open(self.emails_path, 'w', encoding='utf-8') as f:
            json.dump(emails, f)
        process_emails(
            emails_path=self.emails_path,
            processed_ids_path=self.processed_ids_path,
            loop_path=self.loop_path
        )
        with open(self.loop_path, 'r', encoding='utf-8') as f:
            content = f.read()
        loop_md = LoopMarkdown.parse(content)
        self.assertEqual(loop_md.yaml_dict['program'], 'Mecca')
        self.assertIn('alice@mecca.com.au', loop_md.yaml_dict['contacts'])
        self.assertIn('bob@mecca.com.au', loop_md.yaml_dict['contacts'])
        self.assertNotIn('carol@other.com', loop_md.yaml_dict['contacts'])
        self.assertIn('1', loop_md.yaml_dict['source_email_ids'])
        self.assertIn('2', loop_md.yaml_dict['source_email_ids'])
        self.assertIn('4', loop_md.yaml_dict['source_email_ids'])
        self.assertEqual(len(loop_md.signals), 3)
        self.assertTrue(any('RSVP Needed' in sig['subject'] for sig in loop_md.signals))
        self.assertTrue(any('Creative Approval' in sig['subject'] for sig in loop_md.signals))
        self.assertTrue(any('Event Update' in sig['subject'] for sig in loop_md.signals))
        self.assertIn('- [ ] Follow up on missing RSVP', loop_md.tasks)
        self.assertIn('- [ ] Review and approve artwork', loop_md.tasks)
        self.assertEqual(loop_md.tasks.count('- [ ] Follow up on missing RSVP'), 1)
        self.assertEqual(loop_md.tasks.count('- [ ] Review and approve artwork'), 1)

    def test_logging_output(self):
        emails = [self.email1]
        with open(self.emails_path, 'w', encoding='utf-8') as f:
            json.dump(emails, f)
        with patch('process_mecca_emails.logging.info') as mock_log:
            process_emails(
                emails_path=self.emails_path,
                processed_ids_path=self.processed_ids_path,
                loop_path=self.loop_path
            )
            mock_log.assert_called_with(f"Processed Mecca emails and updated loop file at: {self.loop_path}")

if __name__ == '__main__':
    unittest.main() 