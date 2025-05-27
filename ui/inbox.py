import streamlit as st
import os
import glob
import yaml
import re
from pathlib import Path
from datetime import datetime, timedelta
import json
from summary_agent import generate_summary, generate_summary_with_gpt, retrain_summaries_based_on_feedback
from loop_writer import update_loop_summary, update_summary_feedback
from gpt_ora_chat import run_gpt_ora_chat, run_gpt_ora_chat_streaming

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
    last_updated_str = datetime.fromtimestamp(os.path.getmtime(path)).strftime('%Y-%m-%d %H:%M')
    last_updated_dt = datetime.fromtimestamp(os.path.getmtime(path))
    return {
        'path': path,
        'program': yaml_dict.get('program', ''),
        'project': yaml_dict.get('project', ''),
        'confidence': yaml_dict.get('confidence', 0.0),
        'priority': yaml_dict.get('priority', 'low'),
        'ambiguity': yaml_dict.get('ambiguity', False),
        'matched_fields': yaml_dict.get('matched_fields', []),
        'triage_required': triage_required,
        'last_updated': last_updated_str,
        'last_updated_dt': last_updated_dt,
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

def load_program_configs(config_dir='config/programs/'):
    programs = {}
    for path in glob.glob(os.path.join(config_dir, '*.yaml')):
        with open(path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            if data and 'program' in data:
                programs[data['program']] = data.get('projects', [])
    return programs

def update_loop_yaml(path, new_program, new_project):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    yaml_match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    yaml_block = yaml_match.group(1) if yaml_match else ''
    yaml_dict = yaml.safe_load(yaml_block) if yaml_block else {}
    yaml_dict['program'] = new_program
    yaml_dict['project'] = new_project
    yaml_dict['triage_required'] = False
    # Re-render YAML
    new_yaml = yaml.safe_dump(yaml_dict, sort_keys=False, allow_unicode=True).strip()
    rest = content[yaml_match.end():] if yaml_match else content
    new_content = f"---\n{new_yaml}\n---\n{rest}"
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)

def summarize_loop(signals, tasks):
    # Stub: join subjects and tasks for a simple summary
    subjects = ', '.join([s['subject'] for s in signals])
    tasks_str = '; '.join([t[6:] if t.startswith('- [ ] ') else t for t in tasks])
    if subjects and tasks_str:
        return f"This loop covers: {subjects}. Tasks: {tasks_str}."
    elif subjects:
        return f"This loop covers: {subjects}."
    elif tasks_str:
        return f"Tasks: {tasks_str}."
    else:
        return "No summary available."

def update_loop_yaml_summary(path, summary):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    yaml_match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    yaml_block = yaml_match.group(1) if yaml_match else ''
    yaml_dict = yaml.safe_load(yaml_block) if yaml_block else {}
    yaml_dict['summary'] = summary
    new_yaml = yaml.safe_dump(yaml_dict, sort_keys=False, allow_unicode=True).strip()
    rest = content[yaml_match.end():] if yaml_match else content
    new_content = f"---\n{new_yaml}\n---\n{rest}"
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)

def is_stale(last_updated_dt, now=None):
    now = now or datetime.now()
    return (now - last_updated_dt).days > 30

def dashboard_tab(signals, triage_log, filtered_signals=None):
    import pandas as pd
    from datetime import datetime as dt
    st.subheader("System Metrics")
    total_loops = len(signals)
    triage_count = sum(1 for s in signals if s['triage_required'])
    ambiguity_count = sum(1 for s in signals if s['ambiguity'])
    reclass_count = sum(1 for v in triage_log.values() if v.get('action') == 'reclassify')
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Loops", total_loops)
    col2.metric("Triage Required", triage_count)
    col3.metric("Ambiguous", ambiguity_count)
    col4.metric("Reclassifications", reclass_count)
    # Bar chart: loops by program
    st.subheader("Loops by Program")
    prog_counts = pd.Series([s['program'] for s in signals if s['program']]).value_counts()
    st.bar_chart(prog_counts)
    # Table: loops by program/project
    st.subheader("Loops by Program & Project")
    proj_counts = pd.DataFrame([{'Program': s['program'], 'Project': s['project']} for s in signals])
    if not proj_counts.empty:
        st.dataframe(proj_counts.value_counts().reset_index(name='Count'))
    # Triage trend chart
    st.subheader("Triage Trend (Last 30 Days)")
    now = datetime.now()
    triage_dates = [s['last_updated_dt'].date() for s in signals if s['triage_required'] and (now - s['last_updated_dt']).days <= 30]
    if triage_dates:
        from collections import Counter
        date_range = pd.date_range(now - timedelta(days=29), now)
        triage_counts = Counter(triage_dates)
        trend = [triage_counts.get(d.date(), 0) for d in date_range]
        trend_df = pd.DataFrame({'date': date_range, 'triage_required': trend}).set_index('date')
        st.line_chart(trend_df)
    else:
        st.info("No triage backlog in the last 30 days.")
    # Ambiguity trend chart
    st.subheader("Ambiguity Trend (Weekly)")
    ambiguous_loops = [s for s in signals if s['ambiguity']]
    if ambiguous_loops:
        # Group by ISO week and program
        week_prog_counts = {}
        for s in ambiguous_loops:
            week = s['last_updated_dt'].isocalendar()[:2]  # (year, week)
            prog = s['program']
            key = (week, prog)
            week_prog_counts[key] = week_prog_counts.get(key, 0) + 1
        # Build DataFrame
        rows = []
        for (week, prog), count in week_prog_counts.items():
            year, weeknum = week
            rows.append({
                'Year-Week': f"{year}-W{weeknum:02d}",
                'Program': prog,
                'Count': count
            })
        df = pd.DataFrame(rows)
        if not df.empty:
            chart_df = df.pivot(index='Year-Week', columns='Program', values='Count').fillna(0)
            st.bar_chart(chart_df)
        else:
            st.info("No ambiguous loops in the selected date range.")
    else:
        st.info("No ambiguous loops in the selected date range.")
    # Recent reclassification activity
    st.subheader("Recent Reclassifications")
    reclass_rows = []
    for k, v in triage_log.items():
        if v.get('action') == 'reclassify':
            reclass_rows.append({
                'Filename': k,
                'Original Program': v.get('original_program'),
                'Original Project': v.get('original_project'),
                'New Program': v.get('new_program'),
                'New Project': v.get('new_project'),
                'Timestamp': v.get('timestamp')
            })
    if reclass_rows:
        reclass_df = pd.DataFrame(sorted(reclass_rows, key=lambda x: x['Timestamp'], reverse=True))
        st.table(reclass_df.head(10))
    else:
        st.info("No reclassification activity yet.")
    # --- Export Snapshot Button ---
    if st.button("📤 Export Snapshot"):
        now = dt.now().strftime('%Y-%m-%d %H:%M')
        date_str = dt.now().strftime('%Y-%m-%d')
        md = f"""# 📊 EA Signal Dashboard Snapshot\n\n- **Snapshot Time:** {now}\n- **Total Loops:** {total_loops}\n- **Triage Backlog:** {triage_count}\n- **Ambiguous Loops:** {ambiguity_count}\n- **Reclassifications:** {reclass_count}\n\n## Loops by Program\n"""
        for prog, count in prog_counts.items():
            md += f"- **{prog}**: {count}\n"
        md += "\n## Loops by Project\n"
        if not proj_counts.empty:
            for prog in proj_counts['Program'].unique():
                md += f"- **{prog}**:\n"
                for proj, row in proj_counts[proj_counts['Program'] == prog]['Project'].value_counts().items():
                    md += f"    - {proj}: {row}\n"
        md += "\n## Recent Reclassifications\n"
        if reclass_rows:
            for r in reclass_rows[:10]:
                md += f"- `{r['Timestamp']}`: {r['Filename']}\n    - {r['Original Program']} / {r['Original Project']} → {r['New Program']} / {r['New Project']}\n"
        else:
            md += "- _No recent reclassifications._\n"
        out_dir = os.path.join('vault', '0001 HQ')
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, f'dashboard_snapshot-{date_str}.md')
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(md)
        st.success(f"Snapshot exported to {out_path}")
    # --- Export Filtered View Button ---
    if filtered_signals is not None and st.button("📤 Export Current View"):
        now = dt.now().strftime('%Y-%m-%d %H:%M')
        date_str = dt.now().strftime('%Y-%m-%d')
        filtered_prog_counts = pd.Series([s['program'] for s in filtered_signals if s['program']]).value_counts()
        filtered_proj_counts = pd.DataFrame([{'Program': s['program'], 'Project': s['project']} for s in filtered_signals])
        filtered_triage_count = sum(1 for s in filtered_signals if s['triage_required'])
        filtered_ambiguity_count = sum(1 for s in filtered_signals if s['ambiguity'])
        md = f"""# 📊 EA Signal Dashboard Filtered Snapshot\n\n- **Snapshot Time:** {now}\n- **Filtered Loops:** {len(filtered_signals)}\n- **Triage Backlog:** {filtered_triage_count}\n- **Ambiguous Loops:** {filtered_ambiguity_count}\n\n## Visible Programs\n"""
        for prog, count in filtered_prog_counts.items():
            md += f"- **{prog}**: {count}\n"
        md += "\n## Visible Projects\n"
        if not filtered_proj_counts.empty:
            for prog in filtered_proj_counts['Program'].unique():
                md += f"- **{prog}**:\n"
                for proj, row in filtered_proj_counts[filtered_proj_counts['Program'] == prog]['Project'].value_counts().items():
                    md += f"    - {proj}: {row}\n"
        md += "\n## Recent Visible Reclassifications\n"
        filtered_paths = set(s['path'] for s in filtered_signals)
        filtered_reclass_rows = [r for r in reclass_rows if r['Filename'] in filtered_paths]
        if filtered_reclass_rows:
            for r in filtered_reclass_rows[:10]:
                md += f"- `{r['Timestamp']}`: {r['Filename']}\n    - {r['Original Program']} / {r['Original Project']} → {r['New Program']} / {r['New Project']}\n"
        else:
            md += "- _No recent reclassifications in this view._\n"
        out_dir = os.path.join('vault', '0001 HQ')
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, f'dashboard_filtered_snapshot-{date_str}.md')
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(md)
        st.success(f"Filtered snapshot exported to {out_path}")
    # --- Export Ambiguity Snapshot Button ---
    if st.button("📊 Export Ambiguity Snapshot"):
        now = dt.now().strftime('%Y-%m-%d %H:%M')
        date_str = dt.now().strftime('%Y-%m-%d')
        ambiguous_loops = [s for s in signals if s['ambiguity']]
        percent_ambiguous = (len(ambiguous_loops) / total_loops * 100) if total_loops else 0
        md = f"""# 📊 EA Signal Ambiguity Snapshot\n\n- **Snapshot Time:** {now}\n- **Total Loops:** {total_loops}\n- **Ambiguous Loops:** {len(ambiguous_loops)} ({percent_ambiguous:.1f}%)\n\n## Ambiguous Loops\n"""
        for s in ambiguous_loops:
            md += f"- `{s['path']}`\n    - Programs: {', '.join(s['yaml'].get('ambiguous_programs', []))}\n    - Projects: {', '.join(s['yaml'].get('ambiguous_projects', []))}\n"
        md += "\n## Ambiguity Count by Program\n"
        if ambiguous_loops:
            prog_counts = pd.Series([s['program'] for s in ambiguous_loops if s['program']]).value_counts()
            for prog, count in prog_counts.items():
                md += f"- **{prog}**: {count}\n"
        else:
            md += "- _No ambiguous loops._\n"
        md += "\n## Ambiguity Count by Project\n"
        if ambiguous_loops:
            proj_counts = pd.DataFrame([{'Program': s['program'], 'Project': s['project']} for s in ambiguous_loops])
            if not proj_counts.empty:
                for prog in proj_counts['Program'].unique():
                    md += f"- **{prog}**:\n"
                    for proj, row in proj_counts[proj_counts['Program'] == prog]['Project'].value_counts().items():
                        md += f"    - {proj}: {row}\n"
        out_dir = os.path.join('vault', '0001 HQ')
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, f'ambiguous_summary-{date_str}.md')
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(md)
        st.success(f"Ambiguity snapshot exported to {out_path}")
    # --- Export All Summaries Button ---
    if filtered_signals is not None and st.button("📤 Export All Summaries"):
        now = dt.now().strftime('%Y-%m-%d %H:%M')
        date_str = dt.now().strftime('%Y-%m-%d')
        md = f"# 📄 EA Loop Summaries\n\n- **Export Time:** {now}\n- **Total Loops:** {len(filtered_signals)}\n\n"
        for s in filtered_signals:
            rel_path = os.path.relpath(s['path'], start='vault')
            md += f"## {rel_path}\n- **Program:** {s['program']}\n- **Project:** {s['project']}\n- **Summary:**\n  "
            summary = s['yaml'].get('summary')
            if summary:
                md += summary + "\n\n"
            else:
                md += "_No summary available_\n\n"
        out_dir = os.path.join('vault', '0001 HQ')
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, f'summaries-{date_str}.md')
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(md)
        st.success(f"All summaries exported to {out_path}")
    # --- Batch Summarize All Missing Button ---
    if filtered_signals is not None and st.button("💬 Summarize All Missing"):
        now = dt.now().strftime('%Y-%m-%d %H:%M')
        date_str = dt.now().strftime('%Y-%m-%d')
        missing = [s for s in filtered_signals if not s['yaml'].get('summary')]
        progress = st.progress(0)
        for i, s in enumerate(missing):
            try:
                update_loop_summary(s['path'], use_gpt=True)
                st.write(f"✅ {s['path']} summarized.")
            except Exception as e:
                st.write(f"❌ {s['path']} failed: {e}")
            progress.progress((i+1)/len(missing))
        st.success(f"Summarized {len(missing)} loops with GPT.")
    # --- Retrain Low-Quality Summaries Button ---
    if st.button("📈 Retrain Low-Quality Summaries"):
        try:
            with st.spinner("Retraining low-quality summaries with GPT..."):
                retrained = retrain_summaries_based_on_feedback('vault')
            st.success(f"Retrained {len(retrained)} summaries. See log in vault/0001 HQ/summary_retraining_log-{{YYYY-MM-DD}}.md")
        except Exception as e:
            st.error(f"Retraining failed: {e}")

def update_loop_yaml_ambiguity_resolution(path, new_program, new_project, user='ash'):
    from datetime import datetime
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    yaml_match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    yaml_block = yaml_match.group(1) if yaml_match else ''
    yaml_dict = yaml.safe_load(yaml_block) if yaml_block else {}
    yaml_dict['program'] = new_program
    yaml_dict['project'] = new_project
    yaml_dict['ambiguity'] = False
    yaml_dict['triage_required'] = False
    yaml_dict['resolved_by'] = user
    yaml_dict['resolved_at'] = datetime.now().isoformat()
    new_yaml = yaml.safe_dump(yaml_dict, sort_keys=False, allow_unicode=True).strip()
    rest = content[yaml_match.end():] if yaml_match else content
    new_content = f"---\n{new_yaml}\n---\n{rest}"
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)

def main():
    st.set_page_config(page_title="EA Signal Inbox", layout="wide")
    tab_inbox, tab_dashboard, tab_chat = st.tabs(["📥 Inbox", "📊 Dashboard", "🧠 Ora Chat"])
    with tab_inbox:
        st.title("📥 EA Signal Review Inbox")
        vault_root = st.sidebar.text_input("Vault Root", value="vault/")
        config_dir = st.sidebar.text_input("Config Dir", value="config/programs/")
        date_filter = st.sidebar.selectbox("📆 Show loops from...", ["All time", "Last 7 days", "Last 14 days", "Last 30 days"])
        loop_files = find_loop_files(vault_root)
        signals = [parse_loop_file(f) for f in loop_files]
        now = datetime.now()
        if date_filter != "All time":
            days = int(date_filter.split()[1])
            signals = [s for s in signals if (now - s['last_updated_dt']).days < days]
        show_stale = st.sidebar.checkbox("Show stale loops (not updated in 30+ days)", value=False)
        if show_stale:
            signals = [s for s in signals if is_stale(s['last_updated_dt'])]
        programs = sorted(set(s['program'] for s in signals if s['program']))
        priorities = ['high', 'medium', 'low']
        selected_program = st.sidebar.selectbox("Filter by Program", ["All"] + programs)
        selected_priority = st.sidebar.selectbox("Priority", ["All"] + priorities)
        triage_only = st.sidebar.checkbox("Triage Required Only", value=False)
        program_configs = load_program_configs(config_dir)
        filtered = []
        for s in signals:
            if selected_program != "All" and s['program'] != selected_program:
                continue
            if selected_priority != "All" and s['priority'] != selected_priority:
                continue
            if triage_only and not s['triage_required']:
                continue
            filtered.append(s)
        def sort_key(s):
            return (not s['triage_required'], priorities.index(s['priority']) if s['priority'] in priorities else 2)
        filtered = sorted(filtered, key=sort_key)
        grouped = {}
        for s in filtered:
            grouped.setdefault(s['program'], {}).setdefault(s['project'], []).append(s)
        log_path = 'ui/triage_log.json'
        triage_log = load_decision_log(log_path)
        card_style = """
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 1.2em 1.5em 1.2em 1.5em;
            margin-bottom: 1.5em;
            background: #f9f9fa;
        """
        for program in grouped:
            st.header(f"{program}")
            for project in grouped[program]:
                st.subheader(f"{project}")
                for s in grouped[program][project]:
                    key = s['path']
                    with st.container():
                        st.markdown(f'<div style="{card_style}">', unsafe_allow_html=True)
                        st.markdown(f"<b>{s['program']} &rarr; {s['project']}</b>", unsafe_allow_html=True)
                        st.markdown(f"Confidence: <progress value='{s['confidence']}' max='1' style='vertical-align:middle; width:120px;'></progress> <b>{int(s['confidence']*100)}%</b>", unsafe_allow_html=True)
                        st.markdown(f"<span style='background-color:{priority_color(s['priority'])};color:white;padding:2px 10px;border-radius:8px;font-weight:bold;'>Priority: {s['priority'].capitalize()}</span>", unsafe_allow_html=True)
                        if s['matched_fields']:
                            st.markdown("Matched Fields: " + " ".join([f"<span style='background:#e0e0e0;border-radius:6px;padding:2px 8px;margin-right:4px;'>{mf}</span>" for mf in s['matched_fields']]), unsafe_allow_html=True)
                        if s['ambiguity']:
                            st.markdown("<span style='color:#b8860b;font-weight:bold;'>⚠️ Ambiguous classification</span>", unsafe_allow_html=True)
                            st.warning("Ambiguous classification. Please resolve.")
                            ambiguous_programs = s['yaml'].get('ambiguous_programs', [])
                            ambiguous_projects = s['yaml'].get('ambiguous_projects', [])
                            if ambiguous_programs and ambiguous_projects:
                                selected_prog = st.selectbox("Select Program", ambiguous_programs, key=key+"_amb_prog")
                                selected_proj = st.selectbox("Select Project", ambiguous_projects, key=key+"_amb_proj")
                                if st.button("✅ Resolve Ambiguity", key=key+"_resolve_amb"):
                                    update_loop_yaml_ambiguity_resolution(s['path'], selected_prog, selected_proj, user='ash')
                                    triage_log[key] = {
                                        "file": os.path.basename(s['path']),
                                        "action": "resolved_ambiguity",
                                        "from": {"program": s['program'], "project": s['project']},
                                        "to": {"program": selected_prog, "project": selected_proj},
                                        "timestamp": datetime.now().isoformat(),
                                        "resolved_by": "ash"
                                    }
                                    save_decision_log(triage_log, log_path)
                                    st.success(f"Ambiguity resolved: {selected_prog} / {selected_proj}")
                        st.markdown("**Signals:**")
                        for sig in s['signals']:
                            st.markdown(f"- <b>Subject:</b> {sig['subject']}<br>  <b>Body:</b> {sig['body']}", unsafe_allow_html=True)
                        if s['tasks']:
                            st.markdown("**Tasks:**")
                            for t in s['tasks']:
                                st.markdown(f"- [ ] {t[6:]}" if t.startswith('- [ ] ') else f"- {t}")
                        with st.expander("Show YAML Metadata"):
                            st.json(s['yaml'])
                        col1, col2, col3 = st.columns([1,2,1])
                        with col1:
                            if st.button("✅ Confirm", key=key+"_confirm"):
                                triage_log[key] = {"action": "confirm", "timestamp": datetime.now().isoformat()}
                                save_decision_log(triage_log, log_path)
                                st.success("Confirmed.")
                        with col2:
                            new_program = st.selectbox("New Program", list(program_configs.keys()), key=key+"_prog")
                            new_projects = program_configs.get(new_program, [])
                            new_project = st.selectbox("New Project", new_projects, key=key+"_proj")
                            if st.button("🔁 Reclassify", key=key+"_reclass"):
                                triage_log[key] = {
                                    "action": "reclassify",
                                    "timestamp": datetime.now().isoformat(),
                                    "original_program": s['program'],
                                    "original_project": s['project'],
                                    "new_program": new_program,
                                    "new_project": new_project
                                }
                                save_decision_log(triage_log, log_path)
                                update_loop_yaml(s['path'], new_program, new_project)
                                st.info(f"Reclassified to {new_program} / {new_project}.")
                        with col3:
                            if st.button("🗑 Ignore", key=key+"_ignore"):
                                triage_log[key] = {"action": "ignore", "timestamp": datetime.now().isoformat()}
                                save_decision_log(triage_log, log_path)
                                st.warning("Ignored.")
                        if is_stale(s['last_updated_dt']):
                            st.markdown("<span style='color:#b8860b;font-weight:bold;'>⚠️ Stale</span>", unsafe_allow_html=True)
                        # Summarize Loop button (LLM stub)
                        if st.button("💬 Generate Summary", key=key+"_gen_summary"):
                            with open(s['path'], 'r', encoding='utf-8') as f:
                                loop_md = f.read()
                            summary = generate_summary(loop_md)
                            update_loop_summary(s['path'], summary, use_gpt=False)
                            st.success(f"Summary generated: {summary}")
                        # GPT Summary button
                        if st.button("💬 GPT Summary", key=key+"_gpt_summary"):
                            try:
                                update_loop_summary(s['path'], use_gpt=True)
                                with open(s['path'], 'r', encoding='utf-8') as f:
                                    loop_md = f.read()
                                summary = re.search(r'summary:\s*(.*)', loop_md)
                                summary = summary.group(1) if summary else None
                                st.success(f"GPT summary generated: {summary}")
                            except Exception as e:
                                st.error(f"GPT summary failed: {e}")
                        # Show summary if present
                        summary = s['yaml'].get('summary')
                        if summary:
                            st.markdown(f"**Summary:** {summary}")
                            # Feedback section
                            feedback = s['yaml'].get('summary_feedback', {})
                            with st.form(key=key+"_feedback_form"):
                                rating = st.selectbox("Summary Rating", options=[1,2,3,4,5], index=feedback.get('quality_rating', 4)-1 if feedback.get('quality_rating') else 4)
                                flagged = st.checkbox("Flag this summary for review", value=feedback.get('flagged_for_review', False))
                                comment = st.text_area("Optional comment", value=feedback.get('comment', ""))
                                submitted = st.form_submit_button("Save Feedback")
                                if submitted:
                                    update_summary_feedback(s['path'], quality_rating=rating, flagged_for_review=flagged, comment=comment)
                                    st.success("Feedback saved!")
                        st.markdown('</div>', unsafe_allow_html=True)
        if not filtered:
            st.info("No signals match the current filters.")
    with tab_dashboard:
        # Use all signals, not just filtered
        vault_root = st.sidebar.text_input("Vault Root (Dashboard)", value="vault/")
        date_filter = st.sidebar.selectbox("📆 Show loops from... (Dashboard)", ["All time", "Last 7 days", "Last 14 days", "Last 30 days"])
        loop_files = find_loop_files(vault_root)
        signals = [parse_loop_file(f) for f in loop_files]
        now = datetime.now()
        if date_filter != "All time":
            days = int(date_filter.split()[1])
            signals = [s for s in signals if (now - s['last_updated_dt']).days < days]
        log_path = 'ui/triage_log.json'
        triage_log = load_decision_log(log_path)
        dashboard_tab(signals, triage_log)
    with tab_chat:
        st.title("🧠 Ora Chat")
        vault_root = st.text_input("Vault Root (Chat)", value="vault/")
        loop_files = find_loop_files(vault_root)
        signals = [parse_loop_file(f) for f in loop_files]
        # Query history (in-session only)
        if 'ora_query_history' not in st.session_state:
            st.session_state['ora_query_history'] = []
        query = st.text_input("Ask Ora", value=st.session_state.get('ora_query_to_rerun', ''))
        # Sidebar: recent queries
        with st.sidebar.expander("Recent Ora Queries", expanded=True):
            history = st.session_state['ora_query_history']
            if history:
                selected_hist = st.selectbox("Select a recent query", history[::-1], key="ora_hist_select")
                if st.button("Re-run Query"):
                    st.session_state['ora_query_to_rerun'] = selected_hist
                    st.experimental_rerun()
            else:
                st.write("No recent queries.")
        results = []
        if query:
            q = query.lower().strip()
            # Update history (no duplicates, max 5)
            if q and (not st.session_state['ora_query_history'] or q != st.session_state['ora_query_history'][-1]):
                if q in st.session_state['ora_query_history']:
                    st.session_state['ora_query_history'].remove(q)
                st.session_state['ora_query_history'].append(q)
                if len(st.session_state['ora_query_history']) > 5:
                    st.session_state['ora_query_history'] = st.session_state['ora_query_history'][-5:]
            if "summary review" in q:
                results = [s for s in signals if s['yaml'].get('summary_feedback', {}).get('flagged_for_review', False)]
            elif "rated below 3" in q or "rating below 3" in q:
                results = [s for s in signals if s['yaml'].get('summary_feedback', {}).get('quality_rating', 5) <= 3]
            elif q.startswith("summaries for "):
                prog = q.replace("summaries for ", "").strip().lower()
                results = [s for s in signals if s['program'].lower() == prog]
            elif "recent summaries" in q:
                results = sorted([s for s in signals if s['yaml'].get('summary')], key=lambda s: s['last_updated_dt'], reverse=True)[:10]
            elif "missing summaries" in q:
                results = [s for s in signals if not s['yaml'].get('summary')]
        if results:
            for s in results:
                st.markdown(f"### {os.path.relpath(s['path'], start=vault_root)}")
                st.markdown(f"- **Program:** {s['program']}  |  **Project:** {s['project']}")
                summary = s['yaml'].get('summary')
                if summary:
                    st.markdown(f"- **Summary:** {summary}")
                feedback = s['yaml'].get('summary_feedback', {})
                if feedback:
                    st.markdown(f"- **Rating:** {feedback.get('quality_rating', 'N/A')}  |  **Flagged:** {feedback.get('flagged_for_review', False)}")
                    if feedback.get('comment'):
                        st.markdown(f"- **Comment:** {feedback.get('comment')}")
            # Export Chat Results button
            if st.button("📤 Export Chat Results"):
                from datetime import datetime as dt
                now = dt.now().strftime('%Y-%m-%d %H:%M')
                date_str = dt.now().strftime('%Y-%m-%d')
                md = f"# 🧠 Ora Chat Results\n\n- **Export Time:** {now}\n- **Query:** {query}\n- **Result Count:** {len(results)}\n\n"
                for s in results:
                    rel_path = os.path.relpath(s['path'], start=vault_root)
                    md += f"## {rel_path}\n- **Program:** {s['program']}\n- **Project:** {s['project']}\n"
                    summary = s['yaml'].get('summary')
                    if summary:
                        md += f"- **Summary:** {summary}\n"
                    feedback = s['yaml'].get('summary_feedback', {})
                    if feedback:
                        md += f"- **Rating:** {feedback.get('quality_rating', 'N/A')}  |  **Flagged:** {feedback.get('flagged_for_review', False)}\n"
                        if feedback.get('comment'):
                            md += f"- **Comment:** {feedback.get('comment')}\n"
                    md += "\n"
                out_dir = os.path.join('vault', '0001 HQ')
                os.makedirs(out_dir, exist_ok=True)
                out_path = os.path.join(out_dir, f'ora_chat_results-{date_str}.md')
                with open(out_path, 'w', encoding='utf-8') as f:
                    f.write(md)
                st.success(f"Chat results exported to {out_path}")
            # GPT Response button (streaming)
            if st.button("💬 GPT Response"):
                import time
                placeholder = st.empty()
                try:
                    with st.spinner("Generating GPT response..."):
                        tokens = []
                        for token in run_gpt_ora_chat_streaming(query, results):
                            tokens.append(token)
                            placeholder.markdown(''.join(tokens))
                            time.sleep(0.01)
                        gpt_response = ''.join(tokens)
                except Exception as e:
                    gpt_response = f"[GPT-4 ERROR: {e}]"
                    placeholder.markdown(gpt_response)
            if gpt_response:
                with st.expander("GPT Response", expanded=True):
                    st.markdown(gpt_response)
        elif query:
            st.info("No results found for your query.")

        # Hardened query logic for summary review and rated below 3
        if query:
            q = query.lower().strip()
            if "summary review" in q:
                scanned = 0
                matched = 0
                safe_results = []
                for s in signals:
                    feedback = s['yaml'].get('summary_feedback', {})
                    scanned += 1
                    if feedback.get('flagged_for_review', False):
                        safe_results.append(s)
                        matched += 1
                st.info(f"Scanned {scanned} loops, matched {matched} flagged for review.")
            elif "rated below 3" in q or "rating below 3" in q:
                scanned = 0
                matched = 0
                safe_results = []
                for s in signals:
                    feedback = s['yaml'].get('summary_feedback', {})
                    scanned += 1
                    if feedback.get('quality_rating', 5) <= 3:
                        safe_results.append(s)
                        matched += 1
                st.info(f"Scanned {scanned} loops, matched {matched} with rating ≤ 3.")

if __name__ == "__main__":
    main() 