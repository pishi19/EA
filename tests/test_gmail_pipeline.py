import pytest
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from gmail_ingest import classify_message, format_task_block

# Simulated previously seen thread IDs
seen_threads = {"thread-abc", "thread-def"}

# Simulated email threads
mock_threads = [
    {"threadId": "thread-abc", "snippet": "Overdue rent", "payload": {"headers": [{"name": "Subject", "value": "Rent Reminder"}]}},
    {"threadId": "thread-new", "snippet": "Please follow up", "payload": {"headers": [{"name": "Subject", "value": "Maintenance follow up"}]}},
]

def already_seen(thread_id):
    return thread_id in seen_threads

def simulate_ingest_pipeline(threads):
    tasks = []
    for msg in threads:
        thread_id = msg["threadId"]
        if already_seen(thread_id):
            continue
        subject = next((h["value"] for h in msg["payload"]["headers"] if h["name"] == "Subject"), "No Subject")
        label = classify_message(subject + " " + msg["snippet"])
        task = format_task_block(subject, thread_id, label)
        tasks.append(task)
    return tasks

def test_ingest_pipeline_skips_seen_and_formats_new():
    tasks = simulate_ingest_pipeline(mock_threads)
    assert len(tasks) == 1
    assert "thread-new" in tasks[0]
    assert "- [ ]" in tasks[0]
    assert "#email" in tasks[0]
