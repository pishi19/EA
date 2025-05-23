"""
update_insight_panel.py

Appends a summary block to the loop_focus.md insight panel.
"""

from pathlib import Path


def update_insight_panel(loop_id, summary, metadata, file_path):
    panel_dir = Path("/Users/air/AIR01/0001-HQ/Insights")
    panel_dir.mkdir(parents=True, exist_ok=True)  # Ensure path exists
    panel = panel_dir / "loop_focus.md"

    block = f"""\n\n### 🧠 New Insight: {summary[:60]}\n
**Tags**: {metadata['tags']}  
**Status**: {metadata['status']}  
**Priority**: {metadata['priority']}  
**Link**: [Open]({file_path})  
"""
    with panel.open("a") as f:
        f.write(block)
