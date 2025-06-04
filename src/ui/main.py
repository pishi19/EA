from src.ui.pages.page_semantic_dashboard import render_semantic_dashboard
from src.ui.pages.page_loop_slice import render_loop_slice
from src.ui.pages.page_promote_loops import render_promote_loops
from src.ui.pages.page_loop_audit import render_loop_audit
import streamlit as st
st.set_page_config(page_title="Ora UI", layout="wide")

st.sidebar.title("📂 Ora Navigation")
page = st.sidebar.radio("Go to", [
    "Dashboard",
    "Roadmap",
    "Reflections",
    "Phase Tracker",
    "Semantic Dashboard",
    "Loop Slice",
    "Promote Loops",
    "Loop Audit"
])

if page == "Dashboard":
    from src.ui.pages.page_dashboard import render_dashboard
    render_dashboard()
elif page == "Roadmap":
    from src.ui.pages.page_roadmap import render_roadmap
    render_roadmap()
elif page == "Reflections":
    from src.ui.pages.page_reflections import render_reflections
    render_reflections()
elif page == "Phase Tracker":
    from src.ui.pages.page_phase_tracker import render_phase_tracker
    render_phase_tracker()
elif page == "Semantic Dashboard":
    render_semantic_dashboard()
elif page == "Loop Slice":
    render_loop_slice()
elif page == "Promote Loops":
    render_promote_loops()
elif page == "Loop Audit":
    render_loop_audit() 