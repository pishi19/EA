
from pathlib import Path

def load_tasks_from_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    return [line.strip() for line in lines if line.strip().startswith('- [ ]')]

def save_tasks_to_file(path, tasks):
    with open(path, 'w', encoding='utf-8') as f:
        for task in tasks:
            f.write(task + '\n')

def append_related_task_block(file_path, task):
    block = f"\n\n### 🔗 Related Task:\n- {task}\n"
    with open(file_path, 'a', encoding='utf-8') as f:
        f.write(block)
