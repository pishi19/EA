import sys
from pathlib import Path

import streamlit as st

# Add project root for imports
try:
    PROJECT_ROOT = Path(__file__).resolve().parents[3]
    sys.path.append(str(PROJECT_ROOT))
except IndexError:
    PROJECT_ROOT = Path.cwd()
    sys.path.append(str(PROJECT_ROOT))

from src.agent.commands.promote_loop import promote_loop_to_roadmap
from src.data.ui_loaders import load_promotable_loops  # Import from new location

st.set_page_config(page_title="Promote Loops", layout="wide")

def main():
    """Main function to render the Streamlit page."""
    st.header("🔁 Promote Loops to Roadmap")
    st.caption("Select loops to promote into active workstream items.")

    try:
        promotable_loops = load_promotable_loops(
            db_path=PROJECT_ROOT / "runtime/db/ora.db",
            loops_dir=PROJECT_ROOT / "runtime/loops",
            roadmap_dir=PROJECT_ROOT / "runtime/roadmap"
        )

        if not promotable_loops:
            st.success("✅ No promotable loops found.")
        else:
            st.metric("Loops Ready to Promote", len(promotable_loops))
            for loop in promotable_loops:
                with st.expander(f"{loop['title']} (Workstream: {loop.get('workstream', 'N/A')})"):
                    st.markdown(f"**UUID:** `{loop['uuid']}`")
                    st.markdown(f"**Score:** `{loop.get('score', 'N/A')}`")
                    if st.button("Promote", key=loop["uuid"]):
                        with st.spinner("Promoting loop..."):
                            result = promote_loop_to_roadmap(loop["uuid"])
                        if result.get("status") == "success":
                            st.success(f"Loop promoted! New file at: {result.get('file_path')}")
                            st.experimental_rerun()
                        else:
                            st.error(f"Promotion failed: {result.get('error')}")
    except Exception as e:
        st.error("A critical error occurred while loading the page.")
        st.exception(e)

if __name__ == "__main__":
    main()
