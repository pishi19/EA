import os
from datetime import datetime

# Paths (update these for production)
FEEDBACK_SUMMARY_PATH = "/Users/air/AIR01/System/Logs/feedback-summary.md"
PATCH_OUTPUT_DIR = "/Users/air/AIR01/System/GPT_Patches/"

def analyze_feedback():
    # Placeholder analysis: simulate finding issues in the system
    issues = [
        {
            "type": "classification_threshold",
            "current": 0.75,
            "suggested": 0.65,
            "reason": "3 important tasks were missed due to high threshold"
        },
        {
            "type": "ignored_senders",
            "sender": "noreply@platform.test",
            "reason": "7 of 10 tasks from this sender marked as #false_positive"
        }
    ]
    return issues

def generate_patch_markdown(issues):
    now = datetime.now().strftime("%Y-%m-%d")
    filename = f"GPT_Logic_Proposal-{now}.md"
    filepath = os.path.join(PATCH_OUTPUT_DIR, filename)

    markdown = f"""---
title: GPT Logic Patch Proposal
created: {now}
tags: [#gpt_patch, #logic_proposal]
---

# 🧠 GPT-Supervised Logic Proposal

This file contains automatically generated proposals for improving Ora's logic based on recent feedback.

## 📊 Proposed Changes

"""

    for issue in issues:
        if issue["type"] == "classification_threshold":
            markdown += f"""
### 🔧 Adjust Task Classification Threshold

**Issue**: {issue['reason']}  
**Current Threshold**: {issue['current']}  
**Proposed Threshold**: {issue['suggested']}

- [ ] ✅ Approve change
- [ ] ❌ Reject
"""
        elif issue["type"] == "ignored_senders":
            markdown += f"""
### 🛑 Ignore Noisy Sender

**Sender**: {issue['sender']}  
**Issue**: {issue['reason']}  
Proposal: Add to `ignored_senders` in `config.py`

- [ ] ✅ Approve change
- [ ] ❌ Reject
"""

    with open(filepath, "w") as f:
        f.write(markdown)

    print(f"✅ Patch proposal written to {filepath}")

if __name__ == "__main__":
    issues = analyze_feedback()
    generate_patch_markdown(issues)
