from pathlib import Path

# Path adjusted to be relative to project root for execution in local context
project_root = Path(__file__).resolve().parent.parent.parent # Assuming this script itself is in src/utils or similar
# If this script were at project root, project_root = Path(__file__).resolve().parent
# For direct interpretation, let's assume it's being placed in src/utils for now.
# More directly for this operation, we can define base relative to where the edit_file tool runs (project root)

base_ui_path = Path("src/ui")
pages_dir = base_ui_path / "pages"

# Ensure directories exist
base_ui_path.mkdir(parents=True, exist_ok=True)
pages_dir.mkdir(parents=True, exist_ok=True)
print(f"Ensured directories exist: {base_ui_path}, {pages_dir}")

# Create Home.py
home_py_content = r"""import streamlit as st

st.set_page_config(page_title=\"Ora Executive Assistant\", page_icon=\"🧠\", layout=\"wide\")

st.sidebar.title(\"Ora Navigation\")
st.sidebar.info(\"Use the sidebar to navigate.\")

st.title(\"🏡 Welcome to Ora\")
st.write(\"This is the main dashboard of the Executive Assistant system.\")
"""
(base_ui_path / "Home.py").write_text(home_py_content)
print(f"Created/Updated: {base_ui_path / 'Home.py'}")

# Create 0_Workstream_Dashboard.py
dashboard_py_content = r"""import streamlit as st

st.set_page_config(page_title=\"Workstream Dashboard\")

st.title(\"📊 Workstream Dashboard\")
st.write(\"This page will show active phases and project tracking.\")
"""
(pages_dir / "0_Workstream_Dashboard.py").write_text(dashboard_py_content)
print(f"Created/Updated: {pages_dir / '0_Workstream_Dashboard.py'}")

# Create 1_Promote_Loops.py
promote_loops_py_content = r"""import streamlit as st

st.set_page_config(page_title=\"Promote Loops\")

st.title(\"🔁 Promote Loops to Workstream\")
st.write(\"This tool helps convert retrospective loops into roadmap items.\")
"""
(pages_dir / "1_Promote_Loops.py").write_text(promote_loops_py_content)
print(f"Created/Updated: {pages_dir / '1_Promote_Loops.py'}")

print("\nStreamlit UI scaffold created/updated in src/ui/")
print("Main entry point for Streamlit app: src/ui/Home.py")
print("Other pages are in src/ui/pages/")
print("To run: streamlit run src/ui/Home.py")
