from datetime import datetime
from pathlib import Path

import frontmatter

PROJECTS_PATH = "/Users/air/AIR01/02 Workstreams/Projects"
PROGRAMS_PATH = "/Users/air/AIR01/02 Workstreams/Programs"
LOOP_PATH = "/Users/air/AIR01/Retrospectives"
LOG_PATH = "/Users/air/AIR01/System/Logs/loop_weights_log.md"


def extract_feedback_tags():
    log_file = "/Users/air/AIR01/System/Logs/feedback_trace_log.md"
    feedback = {}
    if not Path(log_file).exists():
        return feedback

    with open(log_file, encoding="utf-8") as f:
        for line in f:
            if "→ [[" in line:
                if "#useful" in line:
                    tag = "useful"
                elif "#false_positive" in line:
                    tag = "false_positive"
                else:
                    continue
                parts = line.split("→ [[")
                if len(parts) < 2:
                    continue
                target = parts[1].split("]]")[0].strip()
                feedback.setdefault(target, {"useful": 0, "false_positive": 0})
                feedback[target][tag] += 1
    return feedback


def compute_weight(useful, false_positive, age_days):
    base = useful - false_positive
    decay = max(0, 30 - age_days) / 30
    return round(max(0, base * decay), 2)


def update_weight(file_path, feedback_map):
    post = frontmatter.load(file_path)
    item_id = post.get("id", Path(file_path).stem)
    stats = feedback_map.get(item_id, {"useful": 0, "false_positive": 0})

    created = post.get("created")
    if created:
        try:
            created_date = (
                created
                if isinstance(created, datetime)
                else datetime.strptime(str(created), "%Y-%m-%d")
            )
            age_days = (datetime.now() - created_date).days
        except Exception:
            age_days = 0
    else:
        age_days = 0

    weight = compute_weight(stats["useful"], stats["false_positive"], age_days)
    post["weight"] = weight

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(frontmatter.dumps(post))

    return item_id, weight


def main():
    feedback_map = extract_feedback_tags()
    updates = []

    for folder, type_ in [
        (PROGRAMS_PATH, "program"),
        (PROJECTS_PATH, "project"),
        (LOOP_PATH, "loop"),
    ]:
        for file in Path(folder).glob("*.md"):
            item_id, weight = update_weight(file, feedback_map)
            updates.append((item_id, weight))

    with open(LOG_PATH, "a", encoding="utf-8") as log:
        for item_id, weight in updates:
            log.write(f"{datetime.now().isoformat()} - {item_id} → weight: {weight}\n")

    print(f"✅ Updated weights for {len(updates)} items.")


# ✅ Final test for recursive autologging 3
# ✅ Final verification of fswatch_direct
# ✅ Confirming launchd fswatch_direct agent
if __name__ == "__main__":
    main()
