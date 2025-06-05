import streamlit as st
from pathlib import Path
import yaml

st.set_page_config(page_title="Assistant Inbox", layout="wide")
st.title("📥 Assistant Inbox")

inbox_path = Path("runtime/inbox")
inbox_path.mkdir(parents=True, exist_ok=True)

def load_yaml(file_path):
    try:
        with open(file_path, "r") as f:
            return yaml.safe_load(f) or {}
    except Exception as e:
        return {"error": str(e)}

inbox_files = list(inbox_path.glob("*.yaml"))
st.write(f"Found {len(inbox_files)} incoming signals")

rows = []
for file in inbox_files:
    data = load_yaml(file)
    rows.append({
        "Filename": file.name,
        "Timestamp": data.get("timestamp", "—"),
        "Source": data.get("source", "—"),
        "Tags": ", ".join(data.get("tags", [])) if isinstance(data.get("tags"), list) else data.get("tags", "—"),
    })

if rows:
    st.dataframe(rows, use_container_width=True)
else:
    st.info("No signals found. Drop YAML files into `runtime/inbox/` to populate.")

st.markdown("---")
st.caption("Routing and loop promotion features coming soon.") 