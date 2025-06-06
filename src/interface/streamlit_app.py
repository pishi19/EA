import streamlit as st

st.set_page_config(page_title="Ora Assistant", layout="wide")

from ui.slice import render_slice_view
from ui.vault import render_vault_overview

# Sidebar setup
st.sidebar.title("Ora Navigation")
page = st.sidebar.radio("Go to", ["Inbox", "Loops", "Loop Slice", "Logs", "Reports", "System Health", "Chat", "📂 Vault Overview"])

# Page logic with safe delayed imports
if page == "Inbox":
    from ui.inbox import render_inbox
    render_inbox()

elif page == "Loops":
    st.title("🔁 Loops")
    st.write("Manage and reflect on loop memory entries.")
    # TODO: Load loop memory from SQLite or markdown

elif page == "Loop Slice":
    render_slice_view()

elif page == "Logs":
    st.title("📄 Logs")
    st.write("View execution logs and system output.")
    # TODO: Display logs from /Logs/system-log.md

elif page == "Reports":
    st.title("📊 Reports")
    st.write("Feedback summaries and loop insights.")
    # TODO: Display daily/weekly summaries from feedback tags

elif page == "System Health":
    st.title("🖥 System Health")
    st.write("Status of launchd jobs, sync status, memory metrics.")
    # TODO: Check background jobs and render system metrics

elif page == "Chat":
    from ui.chat import render_chat
    render_chat()

elif page == "📂 Vault Overview":
    render_vault_overview()

st.markdown("---")
st.caption("Ora - GPT-powered local assistant system")
