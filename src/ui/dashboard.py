import streamlit as st

from src.system.data_loader import get_all_loops, get_all_roadmaps


def render_dashboard():
    st.title("📊 Ora Dashboard")

    loops = get_all_loops()
    roadmap = get_all_roadmaps()

    st.subheader("🌀 Recent Loops")
    if not loops:
        st.warning("No loops found.")
    else:
        for loop in loops[:5]:
            st.markdown(f"**{loop['metadata'].get('title', 'Untitled')}**")
            st.caption(f"{loop['created'].strftime('%Y-%m-%d %H:%M')} | Tags: {', '.join(loop['tags'])}")
            st.markdown(loop['content'])
            st.divider()

    st.subheader("🛣️ Active Roadmap Items")
    if not roadmap:
        st.warning("No roadmap entries found.")
    else:
        for item in roadmap[:5]:
            st.markdown(f"- [ ] {item['metadata'].get('title', 'Untitled')} ({item['metadata'].get('id', 'N/A')})")
