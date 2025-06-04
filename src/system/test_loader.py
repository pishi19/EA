from src.system.data_loader import (
    get_all_loops,
    get_all_roadmaps,
    get_inbox_entries,
    get_loop_summaries,
)
from src.system.path_config import (
    LOOPS_DIR,
    ROADMAP_DIR,
    INBOX_DIR,
    REFLECTIONS_DIR,
    INSIGHTS_DIR,
)

def print_section(name, count):
    print(f"[✔] {name}: {count} entries")

def main():
    print("🔍 Ora Vault Loader Test")

    print(f"📁 LOOPS_DIR: {LOOPS_DIR}")
    print(f"📁 ROADMAP_DIR: {ROADMAP_DIR}")
    print(f"📁 INBOX_DIR: {INBOX_DIR}")
    print(f"📁 REFLECTIONS_DIR: {REFLECTIONS_DIR}")
    print(f"📁 INSIGHTS_DIR: {INSIGHTS_DIR}")
    print("")

    print_section("Inbox", len(get_inbox_entries()))
    print_section("Loops", len(get_all_loops()))
    print_section("Loop Summaries", len(get_loop_summaries()))
    print_section("Roadmap Items", len(get_all_roadmaps()))

if __name__ == "__main__":
    main() 