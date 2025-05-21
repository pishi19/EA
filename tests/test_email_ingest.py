import sys
import os
import pytest
from unittest.mock import patch, MagicMock

# Add root path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from gmail_ingest import classify_message, format_task_block

@pytest.mark.parametrize("subject,body,expected", [
    ("Rent payment overdue", "Reminder: rent has not been received", "finance"),
    ("Follow up needed", "Action required for tenant", "task"),
    ("Security Alert", "Motion detected at 3AM", "alert"),
    ("Weekly Summary", "Your performance summary", "info"),
    ("Misc subject", "No classification match", "other")
])
def test_classify_message_all_branches(subject, body, expected):
    result = classify_message(subject + " " + body)
    assert result == expected

def test_format_task_block_contains_expected_tags():
    subject = "Follow up with tenant re: maintenance"
    thread_id = "abc123"
    label = "task"
    task = format_task_block(subject, thread_id, label)
    assert "- [ ]" in task
    assert "#email" in task
    assert f"#{label}" in task
    assert f"https://mail.google.com/mail/u/0/#inbox/{thread_id}" in task
