def render():
    from pathlib import Path

    import streamlit as st

    SIGNAL_TASKS_PATH = Path("/Users/air/AIR01/0001 HQ/Signal_Tasks.md")

    st.title("📥 Inbox")

    def load_tasks():
        if SIGNAL_TASKS_PATH.exists():
            return SIGNAL_TASKS_PATH.read_text().splitlines()
        else:
            return ["⚠️ Signal_Tasks.md not found."]

    def display_tasks(lines):
        task_lines = [line for line in lines if line.strip().startswith("- [")]
        st.subheader("Tasks from Signal_Tasks.md")
        for i, line in enumerate(task_lines):
            checked = line.startswith("- [x]")
            label = line[6:] if "] " in line else line
            st.checkbox(label, value=checked, key=f"task_{i}")

    with st.expander("🔍 Filter"):
        st.text_input("Search")
        st.multiselect("Source", ["email", "imessage", "voice", "manual"])
        st.multiselect("Feedback Tags", ["#useful", "#false_positive", "#loop", "#manual"])

    lines = load_tasks()
    display_tasks(lines)

    task_count = sum(1 for line in lines if line.strip().startswith("- [ ]"))
    st.markdown(f"**Tasks remaining:** {task_count}")
