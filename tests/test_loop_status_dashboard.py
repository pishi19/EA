from collections import Counter

# Simulated loop metadata entries
sample_loops = [
    {"id": "loop-1", "status": "open", "verified": False, "tags": ["#loop", "#gpt"]},
    {"id": "loop-2", "status": "closed", "verified": True, "tags": ["#loop"]},
    {"id": "loop-3", "status": "open", "verified": True, "tags": ["#loop", "#email"]},
    {"id": "loop-4", "status": "draft", "verified": False, "tags": ["#loop", "#draft"]},
    {"id": "loop-5", "status": "closed", "verified": False, "tags": ["#loop"]},
]


def summarize_loop_status(loops):
    return {
        "status_counts": Counter(loop["status"] for loop in loops),
        "verified_counts": Counter(loop["verified"] for loop in loops),
        "tag_counts": Counter(tag for loop in loops for tag in loop["tags"]),
    }


def test_loop_status_summary_counts():
    summary = summarize_loop_status(sample_loops)
    assert summary["status_counts"]["open"] == 2
    assert summary["status_counts"]["closed"] == 2
    assert summary["status_counts"]["draft"] == 1
    assert summary["verified_counts"][True] == 2
    assert summary["verified_counts"][False] == 3
    assert summary["tag_counts"]["#loop"] == 5
    assert summary["tag_counts"]["#gpt"] == 1
    assert summary["tag_counts"]["#email"] == 1
    assert summary["tag_counts"]["#draft"] == 1
