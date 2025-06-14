import streamlit as st

# from ui.panels import chat_panel, inbox_panel  # Removed: ui.panels does not exist

st.set_page_config(page_title="Ora Assistant", layout="wide")

# Sidebar navigation
st.sidebar.title("Ora Navigation")
page = st.sidebar.radio("Go to", ["Inbox", "Loops", "Logs", "Reports", "System Health", "Chat"])

# Page logic
if page == "Inbox":
    # inbox_panel.render()
    from ui.inbox import render_inbox
    render_inbox()

elif page == "Loops":
    st.title("🔁 Loops")
    st.write("Manage and reflect on loop memory entries.")
    # TODO: Load loop memory from SQLite or markdown

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
    # chat_panel.render()
    from ui.chat import render_chat
    render_chat()

st.markdown("---")
st.caption("Ora - GPT-powered local assistant system")
