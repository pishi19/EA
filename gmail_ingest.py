def classify_message(email_text):
    """Classify the email text into a label."""
    text = email_text.lower()
    if "rent" in text and "overdue" in text:
        return "finance"
    elif "follow up" in text or "action required" in text:
        return "task"
    elif "alert" in text or "warning" in text:
        return "alert"
    elif "info" in text or "summary" in text:
        return "info"
    else:
        return "other"

def format_task_block(subject, thread_id, label):
    """Format a markdown task block from email metadata."""
    return f"- [ ] {subject} #email #{label} [🔗](https://mail.google.com/mail/u/0/#inbox/{thread_id})"
