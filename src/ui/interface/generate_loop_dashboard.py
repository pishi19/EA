import json
import sqlite3
from datetime import datetime
from pathlib import Path

import frontmatter

DASHBOARD_PATH = "/Users/air/AIR01/System/Dashboards"
DB_PATH = "/Users/air/AIR01/System/data/loops.db"


def get_loop_metrics(loop_id: str) -> dict:
    """Get comprehensive loop metrics from database."""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                weight,
                useful_count,
                false_positive_count,
                mention_count,
                last_updated,
                impact_score
            FROM loop_metrics
            WHERE loop_id = ?
        """,
            (loop_id,),
        )
        row = cursor.fetchone()
        return (
            {
                "weight": row[0] if row else 0,
                "useful_count": row[1] if row else 0,
                "false_positive_count": row[2] if row else 0,
                "mention_count": row[3] if row else 0,
                "last_updated": row[4] if row else None,
                "impact_score": row[5] if row else 0,
            }
            if row
            else {}
        )


def get_loop_mentions(loop_id: str) -> list[dict]:
    """Get loop mentions from database."""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                source_file,
                context,
                sentiment,
                created_at
            FROM loop_mentions
            WHERE loop_id = ?
            ORDER BY created_at DESC
        """,
            (loop_id,),
        )
        return [
            {
                "source_file": row[0],
                "context": row[1],
                "sentiment": row[2],
                "created_at": row[3],
            }
            for row in cursor.fetchall()
        ]


def calculate_loop_health(metrics: dict) -> str:
    """Calculate loop health status."""
    if metrics["weight"] >= 4.0 and metrics["useful_count"] > metrics["false_positive_count"]:
        return "🟢 Healthy"
    elif metrics["weight"] >= 3.0 and metrics["useful_count"] >= metrics["false_positive_count"]:
        return "🟡 Moderate"
    else:
        return "🔴 Needs Attention"


def generate_dashboard():
    """Generate comprehensive loop dashboard."""
    dashboard_dir = Path(DASHBOARD_PATH)
    dashboard_dir.mkdir(parents=True, exist_ok=True)

    loops = []
    for file in Path("/Users/air/AIR01/Retrospectives").glob("loop-*.md"):
        post = frontmatter.load(file)
        loop_id = file.stem
        metrics = get_loop_metrics(loop_id)
        mentions = get_loop_mentions(loop_id)

        loops.append(
            {
                "id": loop_id,
                "title": post.get("title", "Untitled"),
                "status": post.get("status", "open"),
                "created": post.get("created", ""),
                "metrics": metrics,
                "health": calculate_loop_health(metrics),
                "mentions": mentions,
                "linked_project": post.get("linked_project", None),
            }
        )

    # Sort loops by impact score
    loops.sort(key=lambda x: x["metrics"]["impact_score"], reverse=True)

    # Generate dashboard content
    dashboard_content = f"""---
title: Loop Dashboard
updated: {datetime.now().isoformat()}
---

# 🔄 Loop Dashboard

## 📊 Overview

- Total Loops: {len(loops)}
- Healthy Loops: {sum(1 for l in loops if l["health"] == "🟢 Healthy")}
- Needs Attention: {sum(1 for l in loops if l["health"] == "🔴 Needs Attention")}
- Promoted to Projects: {sum(1 for l in loops if l["linked_project"])}

## 📈 Top Performing Loops

"""

    # Add top performing loops
    for loop in loops[:5]:
        dashboard_content += f"""
### {loop["title"]} ({loop["id"]})
- Health: {loop["health"]}
- Impact Score: {loop["metrics"]["impact_score"]:.2f}
- Weight: {loop["metrics"]["weight"]:.2f}
- Mentions: {loop["metrics"]["mention_count"]}
- Useful/False Positive Ratio: {loop["metrics"]["useful_count"]}/{loop["metrics"]["false_positive_count"]}
"""
        if loop["linked_project"]:
            dashboard_content += f"- Project: {loop['linked_project']}\n"

    # Add detailed loop list
    dashboard_content += "\n## 📋 All Loops\n\n"
    dashboard_content += "| Loop | Status | Health | Impact | Mentions | Project |\n"
    dashboard_content += "|------|--------|--------|--------|----------|----------|\n"

    for loop in loops:
        project_link = f"[View]({loop['linked_project']})" if loop["linked_project"] else "-"
        dashboard_content += f"| {loop['title']} | {loop['status']} | {loop['health']} | {loop['metrics']['impact_score']:.2f} | {loop['metrics']['mention_count']} | {project_link} |\n"

    # Write dashboard
    dashboard_path = dashboard_dir / "loop_dashboard.md"
    with dashboard_path.open("w") as f:
        f.write(dashboard_content)

    # Generate JSON for API
    api_data = {"generated_at": datetime.now().isoformat(), "loops": loops}
    api_path = dashboard_dir / "loop_dashboard.json"
    with api_path.open("w") as f:
        json.dump(api_data, f, indent=2)

    print(f"✅ Dashboard generated at {dashboard_path}")


if __name__ == "__main__":
    generate_dashboard()
