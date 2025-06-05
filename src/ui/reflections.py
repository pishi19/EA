from src.system.data_loader import get_all_loops
import streamlit as st

def render_reflections():
    st.title("📓 Reflections")

    loops = get_all_loops()

    if not loops:
        st.warning("No reflection loops found.")
        return

    for loop in loops:
        metadata = loop.get("metadata", {})
        title = metadata.get("title", "Untitled")
        tags = metadata.get("tags", [])
        created = loop.get("created")

        st.markdown(f"### {title}")
        st.caption(f"📅 {created.strftime('%Y-%m-%d %H:%M')} | Tags: {', '.join(tags)}")
        st.markdown(loop.get("content", ""))
        st.divider() 