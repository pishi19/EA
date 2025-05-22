
from datetime import datetime

def log_trace(log_path, task, target_id, target_type):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"- [{now}] Routed task: `{task}` → {target_type}: `{target_id}`\n"
    with open(log_path, 'a', encoding='utf-8') as f:
        f.write(log_entry)
