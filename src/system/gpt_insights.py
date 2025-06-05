# 🧠 Insight Generator Stub

def generate_insight_from_loop(loop):
    content = loop.get("content", "")
    title = loop["metadata"].get("title", "Untitled Insight")
    return f"Insight: This loop titled '{title}' reflects a recurring theme of prioritization.\n\n{content[:200]}..."
