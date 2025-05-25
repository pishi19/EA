from pathlib import Path

import frontmatter
from utils.classify_utils import classify_task_semantically
from utils.file_utils import (
    append_related_task_block,
    load_tasks_from_file,
    save_tasks_to_file,
)
from utils.trace_log_utils import log_trace

SIGNAL_TASKS_PATH = "/Users/air/AIR01/0001-HQ/Signal_Tasks.md"
PROGRAM_LOG_PATH = "/Users/air/AIR01/System/Logs/program_trace_log.md"
PROJECT_LOG_PATH = "/Users/air/AIR01/System/Logs/project_trace_log.md"
LOOP_LOG_PATH = "/Users/air/AIR01/System/Logs/task_trace_log.md"

MIN_PROGRAM_CONF = 0.85
MIN_PROJECT_CONF = 0.80


def ensure_file(path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    if not Path(path).exists():
        Path(path).write_text("")


def get_linked_loops(project_file):
    post = frontmatter.load(project_file)
    return post.get("linked_loops", [])


def route_task(task):
    if "#ignore" in task:
        return task, []

    matches = classify_task_semantically(task)
    updated_task = task
    routed_ids = []

    for match in matches:
        file_path = match["file"]
        item_type = match["type"]
        score = match["similarity"]
        item_id = Path(file_path).stem

        if item_type == "program" and score >= MIN_PROGRAM_CONF:
            updated_task += f" → [[{item_id}]] #programmed #routed"
            append_related_task_block(file_path, task)
            log_trace(PROGRAM_LOG_PATH, task, item_id, "program")
            routed_ids.append(item_id)

        elif item_type == "project" and score >= MIN_PROJECT_CONF:
            updated_task += f" → [[{item_id}]] #projected #routed"
            append_related_task_block(file_path, task)
            log_trace(PROJECT_LOG_PATH, task, item_id, "project")
            routed_ids.append(item_id)

            # Chain to linked loops
            linked_loops = get_linked_loops(file_path)
            for loop_id in linked_loops:
                loop_path = f"/Users/air/AIR01/Retrospectives/{loop_id}.md"
                append_related_task_block(loop_path, task)
                log_trace(LOOP_LOG_PATH, task, loop_id, "loop")
                updated_task += f" → [[{loop_id}]]"

    return updated_task, routed_ids


def main():
    ensure_file(SIGNAL_TASKS_PATH)
    ensure_file(PROGRAM_LOG_PATH)
    ensure_file(PROJECT_LOG_PATH)
    ensure_file(LOOP_LOG_PATH)

    tasks = load_tasks_from_file(SIGNAL_TASKS_PATH)
    updated_tasks = []

    for task in tasks:
        new_task, _ = route_task(task)
        updated_tasks.append(new_task)

    save_tasks_to_file(SIGNAL_TASKS_PATH, updated_tasks)
    print("✅ Task routing complete.")


if __name__ == "__main__":
    main()
