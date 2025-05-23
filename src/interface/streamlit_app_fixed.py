import streamlit as st
import logging

from ui.panels import chat_panel, inbox_panel

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ✅ This must be the first Streamlit command
st.set_page_config(page_title="Ora Assistant", layout="wide")

# Sidebar navigation
st.sidebar.title("Ora Navigation")
page = st.sidebar.radio("Go to", ["Inbox", "Loops", "Logs", "Reports", "System Health", "Chat"])

# Page logic
if page == "Inbox":
    logger.info("Rendering Inbox panel.")
    inbox_panel.render()

elif page == "Loops":
    logger.info("Rendering Loops panel.")
    st.title("🔁 Loops")
    st.write("Manage and reflect on loop memory entries.")
    # TODO: Load loop memory from SQLite or markdown

elif page == "Logs":
    logger.info("Rendering Logs panel.")
    st.title("📄 Logs")
    st.write("View execution logs and system output.")
    # TODO: Display logs from /Logs/system-log.md

elif page == "Reports":
    logger.info("Rendering Reports panel.")
    st.title("📊 Reports")
    st.write("Feedback summaries and loop insights.")
    # TODO: Display daily/weekly summaries from feedback tags

elif page == "System Health":
    logger.info("Rendering System Health panel.")
    st.title("🖥 System Health")
    st.write("Status of launchd jobs, sync status, memory metrics.")
    # TODO: Check background jobs and render system metrics

elif page == "Chat":
    logger.info("Rendering Chat panel.")
    chat_panel.render()

st.markdown("---")
st.caption("Ora – GPT-powered local assistant system")
