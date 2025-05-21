import pytest
import sys
import os
import re

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Simulate feedback tag extraction
def extract_feedback_tags(text):
    return [tag[1:] for tag in text.split() if tag.startswith("#")]

# Simulate patch proposal logic
def propose_patch_from_feedback(feedback_tags):
    proposals = []
    if "false_positive" in feedback_tags:
        proposals.append("Adjust classification threshold or improve spam filter logic.")
    if "clarity_issue" in feedback_tags:
        proposals.append("Improve loop summary generation or add validation.")
    if "useful" in feedback_tags:
        proposals.append("Reinforce this pattern or boost scoring.")
    return proposals

@pytest.mark.parametrize("input_text,expected", [
    ("This was wrong #false_positive", ["Adjust classification threshold or improve spam filter logic."]),
    ("Too vague #clarity_issue", ["Improve loop summary generation or add validation."]),
    ("#useful", ["Reinforce this pattern or boost scoring."]),
    ("#false_positive #useful", [
        "Adjust classification threshold or improve spam filter logic.",
        "Reinforce this pattern or boost scoring."
    ])
])
def test_patch_proposal_from_feedback(input_text, expected):
    tags = extract_feedback_tags(input_text)
    result = propose_patch_from_feedback(tags)
    assert set(result) == set(expected)
