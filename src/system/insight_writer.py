# 📝 Insight Writer – Persist generated insights to the vault

from datetime import datetime
from pathlib import Path

INSIGHTS_DIR = Path("vault/Retrospectives/Insights")

def write_insight_file(insight_text: str, loop_id: str = "", roadmap_id: str = "", tags: list = None) -> Path:
    timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H%M%S")
    filename = f"insight-{timestamp}.md"
    path = INSIGHTS_DIR / filename

    metadata = {
        "title": f"Insight from {loop_id or 'unknown loop'}",
        "created": datetime.utcnow().isoformat() + "Z",
        "source_loop": loop_id,
        "roadmap_id": roadmap_id,
        "tags": tags or []
    }

    INSIGHTS_DIR.mkdir(parents=True, exist_ok=True)

    with open(path, "w") as f:
        f.write("---\n")
        for key, value in metadata.items():
            f.write(f"{key}: {value}\n")
        f.write("---\n\n")
        f.write(insight_text.strip() + "\n")

    return path
