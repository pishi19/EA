import streamlit as st
import pandas as pd
from pathlib import Path
import frontmatter
from datetime import datetime

st.set_page_config(page_title="Roadmap Promotions", layout="wide")
st.title("📬 Roadmap Promotions")
st.caption("Review and approve roadmap items proposed by the assistant.")

ROADMAP_DIR = Path("runtime/roadmap")

@st.cache_data(ttl=10)
def load_proposed_items():
    """Scans the roadmap directory for proposed items from loops."""
    proposed_items = []
    if not ROADMAP_DIR.exists():
        st.warning("`runtime/roadmap` directory not found.")
        return []

    for md_file in ROADMAP_DIR.glob("*.md"):
        try:
            post = frontmatter.load(md_file)
            if post.get("status") == "proposed" and "origin_loop" in post:
                item = {
                    "uuid": post.get("uuid"),
                    "title": post.get("title", "Untitled"),
                    "workstream": post.get("workstream", "N/A"),
                    "origin_loop": post.get("origin_loop"),
                    "created": post.get("created"),
                    "file_path": md_file
                }
                proposed_items.append(item)
        except Exception as e:
            st.error(f"Error parsing {md_file.name}: {e}")
    
    return sorted(proposed_items, key=lambda x: x.get('created', ''), reverse=True)

def update_roadmap_status(file_path: Path, new_status: str):
    """Updates the status of a roadmap item in its markdown file."""
    try:
        post = frontmatter.load(file_path)
        post['status'] = new_status
        
        # Optionally, add a modified date
        post['modified'] = datetime.now().strftime("%Y-%m-%d")

        with open(file_path, 'wb') as f:
            frontmatter.dump(post, f)
        return True
    except Exception as e:
        st.error(f"Failed to update {file_path.name}: {e}")
        return False


# --- Main UI ---
proposed_items = load_proposed_items()

if not proposed_items:
    st.info("No proposed roadmap items found.")
    st.stop()

st.metric("Items to Review", len(proposed_items))

for i, item in enumerate(proposed_items):
    st.divider()
    col1, col2, col3 = st.columns([4, 1, 1])
    
    with col1:
        st.subheader(item['title'])
        st.markdown(f"**Workstream:** `{item['workstream']}` | **Created:** {item['created']}")
        st.caption(f"Source Loop: {item['origin_loop']}")

    if col2.button("Approve", key=f"approve_{i}", use_container_width=True):
        if update_roadmap_status(item['file_path'], "accepted"):
            st.toast(f"✅ Approved: {item['title']}", icon="👍")
            st.experimental_rerun()

    if col3.button("Reject", key=f"reject_{i}", type="secondary", use_container_width=True):
        if update_roadmap_status(item['file_path'], "rejected"):
            st.toast(f"❌ Rejected: {item['title']}", icon="👎")
            st.experimental_rerun() 