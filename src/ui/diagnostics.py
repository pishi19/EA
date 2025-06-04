from src.system.data_loader import (
    get_all_loops,
    get_inbox_entries,
    get_all_roadmaps,
    get_loop_summaries,
    get_insights,
)
import streamlit as st

def render_diagnostics():
    st.title("🧪 Ora Diagnostics")

    loop_count = len(get_all_loops())
    inbox_count = len(get_inbox_entries())
    roadmap_count = len(get_all_roadmaps())
    summaries_count = len(get_loop_summaries())
    insights_count = len(get_insights())

    st.subheader("📦 Loader Summary")
    st.write(f"📥 Inbox Entries: **{inbox_count}**")
    st.write(f"📓 Loop Files: **{loop_count}**")
    st.write(f"🛣️ Roadmap Items: **{roadmap_count}**")
    st.write(f"🧠 GPT Summaries: **{summaries_count}**")
    st.write(f"📈 Insights: **{insights_count}**")

    if any(c == 0 for c in [loop_count, roadmap_count]):
        st.warning("Some core directories are empty — check vault state.")
    else:
        st.success("All core data sources loaded successfully.") 