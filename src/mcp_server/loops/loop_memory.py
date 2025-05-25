import json
from pathlib import Path

MEMORY_PATH = Path(__file__).parent / "loop_memory.json"


def load_memory():
    if MEMORY_PATH.exists():
        with open(MEMORY_PATH) as f:
            return json.load(f)
    return []


def save_memory(memory):
    with open(MEMORY_PATH, "w") as f:
        json.dump(memory, f, indent=2)


def add_loop(loop_entry):
    memory = load_memory()
    memory.append(loop_entry)
    save_memory(memory)


def query_loops(status=None, principle=None):
    memory = load_memory()
    results = memory
    if status:
        results = [loop for loop in results if loop.get("status") == status]
    if principle:
        results = [loop for loop in results if principle in loop.get("principles", [])]
    return results
