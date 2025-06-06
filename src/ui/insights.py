import streamlit as st

from src.system.data_loader import get_insights


def render_insights():
    st.title("📈 Reflection Insights")

    insights = get_insights()

    if not insights:
        st.warning("No insights found.")
        return

    for item in insights:
        metadata = item.get("metadata", {})
        title = metadata.get("title", "Untitled Insight")
        tags = metadata.get("tags", [])
        created = item.get("created")

        st.markdown(f"### {title}")
        st.caption(f"📅 {created.strftime('%Y-%m-%d %H:%M')} | Tags: {', '.join(tags)}")
        st.markdown(item.get("content", ""))
        st.divider()
