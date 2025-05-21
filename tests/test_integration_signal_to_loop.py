import pytest
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from gmail_ingest import classify_message, format_task_block
from load_loops_for_prompt import format_loops_for_prompt

@pytest.fixture
def mock_email():
    return {
        "subject": "Overdue rent notice",
        "body": "Please follow up regarding missed payment for unit 3A.",
        "threadId": "test-thread-xyz"
    }

def test_signal_classification_to_task_format(mock_email):
    full_text = mock_email["subject"] + " " + mock_email["body"]
    label = classify_message(full_text)
    assert label == "finance" or label == "task"
    task = format_task_block(mock_email["subject"], mock_email["threadId"], label)
    assert "#email" in task and f"#{label}" in task

def test_signal_memory_formatting_pipeline():
    loops = [
        "Task routing improved based on label accuracy.",
        "Signal classification validated using live test email.",
        "System performance confirmed through structured test cases."
    ]
    output = format_loops_for_prompt(loops)
    assert "- Task routing" in output
    assert output.count("-") == len(loops)
