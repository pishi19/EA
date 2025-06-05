from pathlib import Path

# Paths are relative to the project root where this script will be run from.
project_root = Path(".") # Current directory, assuming script is run from project root
pages_dir = project_root / "src" / "ui" / "pages"

def rescaffold_streamlit_pages():
    print(f"Ensuring pages directory exists: {pages_dir}")
    pages_dir.mkdir(parents=True, exist_ok=True)

    # Workstream Dashboard
    ws_dashboard_content = r"""import streamlit as st

st.set_page_config(page_title=\"Workstream Dashboard\")

st.title(\"📊 Workstream Dashboard\")
st.markdown(\"View current roadmap status, phase items, and loop links.\")
"""
    (pages_dir / "0_Workstream_Dashboard.py").write_text(ws_dashboard_content)
    print(f"Created/Updated: {pages_dir / '0_Workstream_Dashboard.py'}")

    # Promote Loops
    promote_loops_content = r"""import streamlit as st

st.set_page_config(page_title=\"Promote Loops\")

st.title(\"🔁 Promote Loops to Roadmap\")
st.markdown(\"Select loops to promote into active workstream items.\")
"""
    (pages_dir / "1_Promote_Loops.py").write_text(promote_loops_content)
    print(f"Created/Updated: {pages_dir / '1_Promote_Loops.py'}")

    # Phase Tracker
    phase_tracker_content = r"""import streamlit as st

st.set_page_config(page_title=\"Phase Tracker\")

st.title(\"🧭 Phase Tracker\")
    st.markdown(\"Track your progress through roadmap phases.\")
"""
    (pages_dir / "2_Phase_Tracker.py").write_text(phase_tracker_content)
    print(f"Created/Updated: {pages_dir / '2_Phase_Tracker.py'}")

    # System Snapshot
    system_snapshot_content = r"""import streamlit as st

st.set_page_config(page_title=\"System Snapshot\")

st.title(\"🧪 System Snapshot + Integrity Check\")
st.markdown(\"Run manifest validation and check system status.\")
"""
    (pages_dir / "3_System_Snapshot.py").write_text(system_snapshot_content)
    print(f"Created/Updated: {pages_dir / '3_System_Snapshot.py'}")

    print("\nStreamlit pages re-scaffolded in src/ui/pages/")

if __name__ == "__main__":
    rescaffold_streamlit_pages() 