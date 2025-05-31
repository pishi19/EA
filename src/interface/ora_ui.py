import os
import json
from pathlib import Path
from typing import Optional
import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))
import streamlit as st
import subprocess
import sys as _sys
import re
from datetime import date, datetime
import yaml
from collections import Counter
import frontmatter
import pandas as pd
from collections import defaultdict
from src.ui.inbox import render_inbox
from src.ui.dashboard import render_dashboard
from src.ui.roadmap import render_roadmap
from src.ui.reflections import render_reflections
from src.ui.chat import render_chat
from src.ui.insights import render_insights
from src.ui.diagnostics import render_diagnostics

def extract_field(lines, field):
    pattern = re.compile(rf"^\*\*{field}:\*\*\s*(.*)", re.IGNORECASE)
    value_lines = []
    capturing = False
    for line in lines:
        line = line.strip()
        if pattern.match(line):
            capturing = True
            value = pattern.match(line).group(1)
            if value:
                value_lines.append(value)
            continue
        if capturing:
            if line.startswith("**") or line.startswith("##") or line.strip() == "---":
                break
            value_lines.append(line)
    return "\n".join(value_lines).strip() if value_lines else None

st.sidebar.title("Navigation")
page = st.sidebar.selectbox(
    "Choose a page",
    [
        "📥 Inbox",
        "🧠 Ora Chat",
        "📘 Reflections",
        "📊 Dashboard",
        "📊 Reflection Insights",
        "🛣️ Roadmap",
        "🧪 Diagnostics"
    ]
)

st.write(f"DEBUG: page = {page}")

if page == "📥 Inbox":
    render_inbox()

elif page == "🧠 Ora Chat":
    render_chat()

elif page == "📘 Reflections":
    render_reflections()

elif page == "📊 Dashboard":
    render_dashboard()

elif page == "📊 Reflection Insights":
    render_insights()

elif page == "🛣️ Roadmap":
    render_roadmap()

elif page == "🧪 Diagnostics":
    render_diagnostics()

