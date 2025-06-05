import streamlit as st
st.set_page_config(page_title="Ora UI", layout="wide")

st.sidebar.title("📂 Ora Navigation")
page = st.sidebar.radio("Go to", [
    "Dashboard",
    "Roadmap",
    "Reflections",
    "Phase Tracker"
])

if page == "Dashboard":
    from pages._0_Dashboard import render_dashboard
    render_dashboard()
elif page == "Roadmap":
    from pages._1_Roadmap import render_roadmap
    render_roadmap()
elif page == "Reflections":
    from pages._2_Reflections import render_reflections
    render_reflections()
elif page == "Phase Tracker":
    from pages._3_Phase_Tracker import render_phase_tracker
    render_phase_tracker() 