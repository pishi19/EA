from src.system.data_loader import (
    get_all_loops,
    get_all_roadmaps,
    get_inbox_entries,
    get_loop_summaries,
    get_insights,
)

def print_summary(label, count):
    print(f"[✓] {label}: {count} entries")

def main():
    print("🧪 Ora System Diagnostics")

    print_summary("Inbox", len(get_inbox_entries()))
    print_summary("Loops", len(get_all_loops()))
    print_summary("Summaries", len(get_loop_summaries()))
    print_summary("Roadmaps", len(get_all_roadmaps()))
    print_summary("Insights", len(get_insights()))

if __name__ == "__main__":
    main()
