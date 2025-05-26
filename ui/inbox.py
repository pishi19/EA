import streamlit as st
import os
import glob
import yaml
import re
from pathlib import Path
from datetime import datetime
import json

def find_loop_files(vault_root='vault/'):
    return glob.glob(os.path.join(vault_root, '**', 'loop-*.md'), recursive=True)

def parse_loop_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    yaml_match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    yaml_block = yaml_match.group(1) if yaml_match else ''
    yaml_dict = yaml.safe_load(yaml_block) if yaml_block else {}
    rest = content[yaml_match.end():] if yaml_match else content
    # Find all signals (blockquote)
    signals = re.findall(r'> \*\*Subject:\*\* (.*?)  \n> \*\*Body:\*\* (.*?)\n', rest, re.DOTALL)
    signal_blocks = [
        {'subject': s[0].strip(), 'body': s[1].strip()} for s in signals
    ]
    # Find tasks section
    tasks_section = re.search(r'### ✅ Tasks\n([\s\S]+?)(?=\n#|\Z)', rest)
    tasks = []
    if tasks_section:
        tasks = re.findall(r'- \[ \] .+', tasks_section.group(1))
    # Triage required: ambiguity or explicit field
    triage_required = yaml_dict.get('ambiguity', False) or yaml_dict.get('triage_required', False)
    # Last updated (file mtime)
    last_updated = datetime.fromtimestamp(os.path.getmtime(path)).strftime('%Y-%m-%d %H:%M')
    return {
        'path': path,
        'program': yaml_dict.get('program', ''),
        'project': yaml_dict.get('project', ''),
        'confidence': yaml_dict.get('confidence', 0.0),
        'priority': yaml_dict.get('priority', 'low'),
        'ambiguity': yaml_dict.get('ambiguity', False),
        'matched_fields': yaml_dict.get('matched_fields', []),
        'triage_required': triage_required,
        'last_updated': last_updated,
        'signals': signal_blocks,
        'tasks': tasks,
        'yaml': yaml_dict,
    }

def load_decision_log(log_path='ui/triage_log.json'):
    if os.path.exists(log_path):
        with open(log_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_decision_log(log, log_path='ui/triage_log.json'):
    with open(log_path, 'w', encoding='utf-8') as f:
        json.dump(log, f, indent=2)

def priority_color(priority):
    if priority == 'high':
        return 'red'
    if priority == 'medium':
        return 'orange'
    return 'green'

def main():
    st.set_page_config(page_title="EA Signal Inbox", layout="wide")
    st.title("📥 EA Signal Review Inbox")
    vault_root = st.sidebar.text_input("Vault Root", value="vault/")
    loop_files = find_loop_files(vault_root)
    signals = [parse_loop_file(f) for f in loop_files]
    # Sidebar filters
    programs = sorted(set(s['program'] for s in signals if s['program']))
    priorities = ['high', 'medium', 'low']
    selected_program = st.sidebar.selectbox("Filter by Program", ["All"] + programs)
    selected_priority = st.sidebar.selectbox("Priority", ["All"] + priorities)
    triage_only = st.sidebar.checkbox("Triage Required Only", value=False)
    # Filter
    filtered = []
    for s in signals:
        if selected_program != "All" and s['program'] != selected_program:
            continue
        if selected_priority != "All" and s['priority'] != selected_priority:
            continue
        if triage_only and not s['triage_required']:
            continue
        filtered.append(s)
    # Sort: triage_required, then priority
    def sort_key(s):
        return (not s['triage_required'], priorities.index(s['priority']) if s['priority'] in priorities else 2)
    filtered = sorted(filtered, key=sort_key)
    # Group by Program > Project
    grouped = {}
    for s in filtered:
        grouped.setdefault(s['program'], {}).setdefault(s['project'], []).append(s)
    # Load triage log
    log_path = 'ui/triage_log.json'
    triage_log = load_decision_log(log_path)
    # Card style
    card_style = """
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 1.2em 1.5em 1.2em 1.5em;
        margin-bottom: 1.5em;
        background: #f9f9fa;
    """
    # Display
    for program in grouped:
        st.header(f"{program}")
        for project in grouped[program]:
            st.subheader(f"{project}")
            for s in grouped[program][project]:
                key = s['path']
                with st.container():
                    st.markdown(f'<div style="{card_style}">', unsafe_allow_html=True)
                    # Header
                    st.markdown(f"<b>{s['program']} &rarr; {s['project']}</b>", unsafe_allow_html=True)
                    # Confidence bar
                    st.markdown(f"Confidence: <progress value='{s['confidence']}' max='1' style='vertical-align:middle; width:120px;'></progress> <b>{int(s['confidence']*100)}%</b>", unsafe_allow_html=True)
                    # Priority badge
                    st.markdown(f"<span style='background-color:{priority_color(s['priority'])};color:white;padding:2px 10px;border-radius:8px;font-weight:bold;'>Priority: {s['priority'].capitalize()}</span>", unsafe_allow_html=True)
                    # Matched fields as tags
                    if s['matched_fields']:
                        st.markdown("Matched Fields: " + " ".join([f"<span style='background:#e0e0e0;border-radius:6px;padding:2px 8px;margin-right:4px;'>{mf}</span>" for mf in s['matched_fields']]), unsafe_allow_html=True)
                    # Ambiguity warning
                    if s['ambiguity']:
                        st.warning("⚠️ Ambiguity detected. Please review this signal.")
                    # All signals
                    st.markdown("**Signals:**")
                    for sig in s['signals']:
                        st.markdown(f"- <b>Subject:</b> {sig['subject']}<br>  <b>Body:</b> {sig['body']}", unsafe_allow_html=True)
                    # Tasks
                    if s['tasks']:
                        st.markdown("**Tasks:**")
                        for t in s['tasks']:
                            st.markdown(f"- [ ] {t[6:]}" if t.startswith('- [ ] ') else f"- {t}")
                    # YAML metadata in expander
                    with st.expander("Show YAML Metadata"):
                        st.json(s['yaml'])
                    # Triage buttons
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        if st.button("✅ Confirm", key=key+"_confirm"):
                            triage_log[key] = {"action": "confirm", "timestamp": datetime.now().isoformat()}
                            save_decision_log(triage_log, log_path)
                            st.success("Confirmed.")
                    with col2:
                        if st.button("🔁 Reclassify", key=key+"_reclass"):
                            triage_log[key] = {"action": "reclassify", "timestamp": datetime.now().isoformat()}
                            save_decision_log(triage_log, log_path)
                            st.info("Marked for reclassification.")
                    with col3:
                        if st.button("🗑 Ignore", key=key+"_ignore"):
                            triage_log[key] = {"action": "ignore", "timestamp": datetime.now().isoformat()}
                            save_decision_log(triage_log, log_path)
                            st.warning("Ignored.")
                    st.markdown('</div>', unsafe_allow_html=True)
    if not filtered:
        st.info("No signals match the current filters.")

if __name__ == "__main__":
    main() 