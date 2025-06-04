import streamlit as st
from pathlib import Path
import frontmatter
import glob
from datetime import datetime
import re
from src.system.trust import safe_write

def load_roadmap_items():
    roadmap_dir = Path('src/roadmap')
    items = []
    for file in sorted(roadmap_dir.glob('*.md')):
        try:
            post = frontmatter.load(file)
            meta = post.metadata
            items.append({
                'title': meta.get('title', file.stem),
                'description': meta.get('instructions', post.content),
                'status': meta.get('status', '').lower(),
                'done': meta.get('done', False),
                'id': meta.get('id', file.stem),
                'phase': meta.get('phase'),
                'archived': meta.get('archived', False),
                'loop_id': meta.get('loop_id'),
                'phase_id': meta.get('phase_id'),
                'file': file,
            })
        except Exception as e:
            st.warning(f"Failed to load {file}: {e}")
    for file in sorted(roadmap_dir.glob('*.yaml')):
        try:
            post = frontmatter.load(file)
            meta = post.metadata
            items.append({
                'title': meta.get('title', file.stem),
                'description': meta.get('instructions', post.content),
                'status': meta.get('status', '').lower(),
                'done': meta.get('done', False),
                'id': meta.get('id', file.stem),
                'phase': meta.get('phase'),
                'archived': meta.get('archived', False),
                'loop_id': meta.get('loop_id'),
                'phase_id': meta.get('phase_id'),
                'file': file,
            })
        except Exception as e:
            st.warning(f"Failed to load {file}: {e}")
    return items

def is_active_phase(item):
    if item.get('archived', False):
        return False
    phase = item.get('phase')
    if not phase:
        id_val = str(item.get('id', ''))
        m = re.match(r'([0-9]+\.[0-9]+)', id_val)
        if m:
            phase = m.group(1)
    if not phase:
        return False
    try:
        major, minor = map(int, str(phase).split('.'))
        if major == 1:
            return True
        if major == 2 and minor == 0:
            return True
        return False
    except Exception:
        return False

def find_linked_file(item):
    file_id = item.get('loop_id') or item.get('phase_id') or item.get('id')
    if not file_id:
        return None
    vault_dir = Path('vault')
    for f in vault_dir.rglob(f'*{file_id}*'):
        if f.is_file():
            return f
    loops_dir = Path('src/loops')
    for f in loops_dir.glob(f'*{file_id}*'):
        if f.is_file():
            return f
    roadmap_dir = Path('src/roadmap')
    for f in roadmap_dir.glob(f'*{file_id}*'):
        if f.is_file():
            return f
    return None

def log_feedback(feedback, comment, items):
    log_dir = Path('logs/ui_feedback')
    log_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    log_path = log_dir / f'roadmap_feedback_{timestamp}.md'
    with open(log_path, 'w', encoding='utf-8') as f:
        f.write(f"# Roadmap Feedback\n")
        f.write(f"- Timestamp: {timestamp}\n")
        f.write(f"- User response: {feedback}\n")
        if comment:
            f.write(f"- User comment: {comment}\n")
        f.write(f"- Roadmap items shown:\n")
        for item in items:
            f.write(f"  - {item['title']}\n")
    # Also append to the loop file
    loop_feedback_path = Path('vault/Retrospectives/roadmap_feedback_loop.md')
    loop_feedback_path.parent.mkdir(parents=True, exist_ok=True)
    with open(loop_feedback_path, 'a', encoding='utf-8') as f:
        f.write(f"\n## Feedback from {timestamp}\n")
        f.write(f"- User response: {feedback}\n")
        if comment:
            f.write(f"- User comment: {comment}\n")
        f.write(f"- Number of roadmap items shown: {len(items)}\n")


def update_done_status(file, new_done):
    post = frontmatter.load(file)
    post['done'] = new_done
    with open(file, 'w', encoding='utf-8') as f:
        f.write(frontmatter.dumps(post))

def render_roadmap():
    st.title('🗺️ Project Roadmap')
    all_items = load_roadmap_items()
    items = [item for item in all_items if is_active_phase(item)]
    if not items:
        st.warning('⚠️ No roadmap found')
        st.stop()
    cols = st.columns(2) if len(items) > 1 else [st]
    for idx, item in enumerate(items):
        with cols[idx % len(cols)]:
            st.markdown(f"#### {item['title']}")
            checkbox_key = f"done_{item['id']}"
            prev_done = bool(item.get('done', False))
            new_done = st.checkbox('Completed', value=prev_done, key=checkbox_key)
            st.caption(f"ID: {item['id']}")
            st.markdown(item['description'])
            linked = find_linked_file(item)
            if linked:
                st.markdown(f"[🔗 View Related File]({linked.as_posix()})")
            else:
                st.caption('🔍 File not found')
            st.divider()
            if new_done != prev_done:
                update_done_status(item['file'], new_done)
                st.success(f'✅ Status updated for {item["title"]}')
    st.subheader('Feedback')
    st.write('❓ Did this roadmap view match your expectations?')
    feedback = st.radio('Your answer:', ['Yes', 'No'], key='roadmap_feedback')
    comment = ''
    if feedback == 'No':
        comment = st.text_area('What was missing or unexpected?', key='roadmap_feedback_comment')
        if comment.strip():
            if st.button('Submit Feedback'):
                log_feedback(feedback, comment, items)
                st.success('Thank you for your feedback!')
    elif feedback == 'Yes':
        if st.button('Submit Feedback'):
            log_feedback(feedback, '', items)
            st.success('Thank you for your feedback!')

# Example usage:
# safe_write('/root/ea_cursor_system_coupled/src/ui/roadmap.py', modified_content, trust_enforced=True) 