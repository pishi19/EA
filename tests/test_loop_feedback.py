import os
import sys

import pytest

# Add root path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


# Simulate feedback classifier or feedback tag extractor
def extract_feedback_tags(text):
    tags = []
    if "#useful" in text:
        tags.append("useful")
    if "#false_positive" in text:
        tags.append("false_positive")
    if "#clarity_issue" in text:
        tags.append("clarity_issue")
    return tags


@pytest.mark.parametrize(
    "input_text,expected",
    [
        ("This was great #useful", ["useful"]),
        ("Why did this show up? #false_positive", ["false_positive"]),
        ("Too vague #clarity_issue", ["clarity_issue"]),
        ("#useful #false_positive", ["useful", "false_positive"]),
        ("No feedback tags here", []),
    ],
)
def test_extract_feedback_tags(input_text, expected):
    result = extract_feedback_tags(input_text)
    assert set(result) == set(expected)
