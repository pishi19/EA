import streamlit as st
from system.data_loader import get_all_loops, get_all_roadmaps
from system.loop_writer import save_loop_file
from system.gpt_insights import generate_insight_from_loop
from system.roadmap_registry import roadmap_registry
from system.status_writer import write_status

def render_slice_view():
    st.title('🔍 Loop Slice – Editable View + Roadmap Link')
    roadmap_id = roadmap_registry.get('render_slice_view', '—')
    st.caption(f'📌 Roadmap ID: {roadmap_id}')

    loops = get_all_loops()
    roadmaps = get_all_roadmaps()

    loop_titles = [l['metadata'].get('title', l['path']) for l in loops]
    selected = st.selectbox('Select a loop', options=loop_titles)

    selected_loop = next(l for l in loops if l['metadata'].get('title', l['path']) == selected)
    metadata = selected_loop['metadata']
    write_status("render_slice_view", loop_id=metadata.get("id", ""), roadmap_id=roadmap_id, action="view_loop")
    path = selected_loop['path']

    st.subheader('📄 Loop Content')
    content = st.text_area('Content', selected_loop['content'], height=200)

    st.subheader('🧾 Editable YAML Metadata')
    updated_metadata = {}
    for key, val in metadata.items():
        updated_metadata[key] = st.text_input(key, str(val))

    if st.button('💾 Save Loop'):
        write_status("render_slice_view", loop_id=metadata.get("id", ""), roadmap_id=roadmap_id, action="save")
        save_loop_file(path, content, updated_metadata)
        st.success('Loop updated successfully.')

    if st.button('🧠 Generate Insight'):
        write_status("render_slice_view", loop_id=metadata.get("id", ""), roadmap_id=roadmap_id, action="generate_insight")
        insight = generate_insight_from_loop(selected_loop)
        st.code(insight, language='markdown') 