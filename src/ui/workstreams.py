import streamlit as st

# Mock data for initial development
MOCK_WORKSTREAMS = [
    {
        "id": "ws1",
        "name": "Program Alpha",
        "type": "Program",
        "priority": 1,
        "status": "Active",
        "tags": ["Strategy", "Q3"],
        "loops": [
            {"id": "loop1", "title": "Initial Research Loop", "last_updated": "2024-05-28", "weight": 5, "feedback_useful": 10},
            {"id": "loop2", "title": "Development Sprint 1", "last_updated": "2024-06-01", "weight": 3, "feedback_useful": 5},
        ],
    },
    {
        "id": "ws2",
        "name": "Project Phoenix",
        "type": "Project",
        "priority": 2,
        "status": "Active",
        "tags": ["Execution", "High-Impact"],
        "loops": [
            {"id": "loop3", "title": "User Testing", "last_updated": "2024-05-15", "weight": 4, "feedback_useful": 8},
        ],
    },
    {
        "id": "ws3",
        "name": "Project Gamma",
        "type": "Project",
        "priority": 3,
        "status": "Planned",
        "tags": ["Research"],
        "loops": [],
    },
    {
        "id": "ws4",
        "name": "Program Omega",
        "type": "Program",
        "priority": 4,
        "status": "Paused",
        "tags": ["Long-term"],
        "loops": [
             {"id": "loop4", "title": "Exploratory Phase", "last_updated": "2024-03-10", "weight": 2, "feedback_useful": 2},
        ],
    },
]

# Mock data for loops (to be replaced with actual data loading)
MOCK_LOOPS_POOL = [
    {"id": "loop1", "title": "Initial Research Loop", "last_updated": "2024-05-28", "weight": 5, "feedback_useful": 10},
    {"id": "loop2", "title": "Development Sprint 1", "last_updated": "2024-06-01", "weight": 3, "feedback_useful": 5},
    {"id": "loop3", "title": "User Testing", "last_updated": "2024-05-15", "weight": 4, "feedback_useful": 8},
    {"id": "loop4", "title": "Exploratory Phase", "last_updated": "2024-03-10", "weight": 2, "feedback_useful": 2},
    {"id": "loop5", "title": "Documentation Review", "last_updated": "2024-06-02", "weight": 1, "feedback_useful": 1},
    {"id": "loop6", "title": "Performance Optimization", "last_updated": "2024-05-20", "weight": 4, "feedback_useful": 6},
]


def render_workstreams():
    st.title("Workstreams Management")

    # Placeholder for workstreams.json loading
    # For now, use mock data
    workstreams_data = MOCK_WORKSTREAMS

    st.sidebar.subheader("View Options")
    view_mode = st.sidebar.radio("View Mode", ["Program View", "Project View"], key="workstream_view_mode")
    
    # Add more filters as needed
    # status_filter = st.sidebar.multiselect("Filter by Status", options=["Active", "Planned", "Paused"], default=["Active", "Planned", "Paused"])
    # tag_filter = st.sidebar.text_input("Filter by Tag (comma-separated)")

    if not workstreams_data:
        st.info("No workstreams found. Create `workstreams.json` or add static data.")
        return

    # Filter logic (example)
    # filtered_workstreams = [
    #     ws for ws in workstreams_data
    #     if ws["status"] in status_filter and 
    #     (not tag_filter or any(t.lower() in ws.get("tags", []) for t in tag_filter.lower().split(',')))
    # ]
    
    if view_mode == "Program View":
        display_data = [ws for ws in workstreams_data if ws["type"] == "Program"]
        st.header("Programs")
    elif view_mode == "Project View":
        display_data = [ws for ws in workstreams_data if ws["type"] == "Project"]
        st.header("Projects")
    else: # Default to all if something goes wrong
        display_data = workstreams_data
        st.header("All Workstreams")


    if not display_data:
        st.info(f"No {view_mode.lower().replace(' view','s')} found for the current filters.")
        return

    # Sorting (Basic - can be enhanced with drag/drop later)
    # For now, assume data is pre-sorted by priority or allow manual score input
    # display_data.sort(key=lambda x: x["priority"]) # Assuming priority is a sortable field

    for ws in display_data:
        with st.expander(f"{ws['name']} ({ws['type']}) - Priority: {ws['priority']}, Status: {ws['status']}", expanded=True):
            st.markdown(f"**Tags:** {', '.join(ws.get('tags', ['N/A']))}")
            
            st.subheader("Associated Loops:")
            if ws["loops"]:
                for loop in ws["loops"]:
                    col1, col2, col3, col4 = st.columns(4)
                    with col1:
                        st.markdown(f"**{loop['title']}**")
                    with col2:
                        st.caption(f"Updated: {loop['last_updated']}")
                    with col3:
                        st.caption(f"Weight: {loop['weight']}")
                    with col4:
                        st.markdown(f"<span style='font-size: smaller; background-color: #e8f5e9; color: #2e7d32; padding: 2px 6px; border-radius: 10px;'>👍 {loop['feedback_useful']}</span>", unsafe_allow_html=True)
            else:
                st.caption("No loops associated yet.")

            # Placeholder for Loop Assignment (Phase 2)
            st.markdown("---")
            st.subheader("Assign Loop (Phase 2)")
            available_loops_for_assignment = [l["title"] for l in MOCK_LOOPS_POOL if l not in ws["loops"]] # Simplistic check
            if available_loops_for_assignment:
                selected_loop_title = st.selectbox("Select a loop to assign:", [""] + available_loops_for_assignment, key=f"assign_loop_{ws['id']}")
                if selected_loop_title and st.button("Assign Loop", key=f"assign_btn_{ws['id']}"):
                    # This is where you'd update the data model (e.g., workstreams.json and loop frontmatter)
                    st.success(f"Loop '{selected_loop_title}' assigned to '{ws['name']}'. (Mock action)")
                    # Rerun to reflect change (in real app, update state)
                    # st.experimental_rerun() 
            else:
                st.caption("No unassigned loops available or all loops already assigned.")


if __name__ == "__main__":
    # This allows you to run the module independently for testing if needed
    # You'd need to ensure Streamlit is installed and run `streamlit run src/ui/workstreams.py`
    # from the root of your project, potentially adjusting PYTHONPATH.
    render_workstreams() 