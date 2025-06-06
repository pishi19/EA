import json

import streamlit as st

from src.system.roadmap_registry import roadmap_registry
from src.system.status_writer import write_status


def render_vault_overview():
    st.title("📂 Vault Overview")
    roadmap_id = roadmap_registry.get("render_vault_overview", "—")
    st.caption(f"📌 Roadmap ID: {roadmap_id}")

    try:
        with open("System/vault_index.json") as f:
            index = json.load(f)
    except Exception as e:
        st.error(f"Could not load index: {e}")
        return

    loops = [i for i in index if i.get("type") == "loop"]
    insights = [i for i in index if i.get("type") == "insight"]

    st.subheader("🌀 Recent Loops")
    for loop in loops[:10]:
        st.markdown(f"**{loop['title']}**")
        st.caption(f"📅 {loop['created']} | 🏷 {', '.join(loop.get('tags', []))}")
        st.code(loop['path'], language="bash")
        st.divider()

    st.subheader("💡 Recent Insights")
    for ins in insights[:10]:
        st.markdown(f"**{ins['title']}**")
        st.caption(f"📅 {ins['created']} | 🏷 {', '.join(ins.get('tags', []))}")
        st.code(ins['path'], language="bash")
        st.divider()

    write_status("render_vault_overview", roadmap_id=roadmap_id, action="view")
