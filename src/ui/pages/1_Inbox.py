import uuid
from datetime import datetime
from pathlib import Path

import streamlit as st
import yaml

st.set_page_config(page_title="Assistant Inbox", layout="wide")
st.title("📥 Assistant Inbox")

inbox_path = Path("runtime/inbox")
loop_path = Path("runtime/loops")
inbox_path.mkdir(parents=True, exist_ok=True)
loop_path.mkdir(parents=True, exist_ok=True)

# Load inbox signals
def load_yaml(file_path):
    try:
        with open(file_path) as f:
            return yaml.safe_load(f) or {}
    except Exception as e:
        return {"error": str(e)}

inbox_files = list(inbox_path.glob("*.yaml"))
signals = {f.name: load_yaml(f) for f in inbox_files}

if not signals:
    st.info("No signals found. Drop YAML files into `runtime/inbox/` to populate.")
    st.stop()

# Select signal
selected = st.selectbox("Select a signal to view and promote", list(signals.keys()))
data = signals[selected]

st.subheader(f"📄 Preview: {selected}")
st.code(yaml.dump(data, sort_keys=False), language="yaml")

# Optional display of fields
st.markdown(f"**Subject:** {data.get('subject', '—')}")
st.markdown(f"**Body:** {data.get('body', '—')}")

# Promote button
if st.button("🚀 Promote to Loop"):
    slug = data.get("source", "untitled").replace(" ", "-").lower()
    today = datetime.today().strftime("%Y-%m-%d")
    loop_filename = f"loop-{today}-{slug}.md"
    loop_file = loop_path / loop_filename

    loop_yaml = {
        "title": data.get("subject", "Untitled Loop"),
        "uuid": str(uuid.uuid4()),
        "tags": data.get("tags", []),
        "origin": "inbox",
        "promoted": today
    }

    content = f"---\n{yaml.dump(loop_yaml)}---\n\n{data.get('body', '')}"
    loop_file.write_text(content)
    st.success(f"✅ Created loop: {loop_filename}")

st.markdown("---")
st.caption("Routing and loop promotion features coming soon.")
