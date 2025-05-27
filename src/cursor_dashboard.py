import json
from pathlib import Path
from typing import Optional

from openai import OpenAI
import pandas as pd
import streamlit as st
from gpt_supervised.config import OPENAI_API_KEY
import subprocess
import sys
import re
from datetime import date, datetime
import yaml
from collections import Counter


def main() -> None:
    st.set_page_config(page_title="Cursor Dashboard", layout="wide")

    # Store page config in session state for testing
    st.session_state["page_title"] = "Cursor Dashboard"
    st.session_state["page_icon"] = "🤖"
    st.session_state["layout"] = "wide"

    # Sidebar navigation
    st.sidebar.title("Navigation")
    # Set default page to '📍 Roadmap' on first load
    if 'page' not in st.session_state:
        st.session_state['page'] = '📍 Roadmap'
    page = st.sidebar.radio("Go to", ["📥 Inbox", "📊 Dashboard", "🧠 Ora Chat", "📍 Roadmap", "📘 Reflections", "📊 Reflection Insights"], index=["📥 Inbox", "📊 Dashboard", "🧠 Ora Chat", "📍 Roadmap", "📘 Reflections", "📊 Reflection Insights"].index(st.session_state['page']) if 'page' in st.session_state else 0)
    st.session_state['page'] = page

    # Error log for sidebar
    if 'roadmap_errors' not in st.session_state:
        st.session_state['roadmap_errors'] = []
    def log_roadmap_error(msg):
        st.session_state['roadmap_errors'].append(msg)
    if st.session_state['roadmap_errors']:
        with st.sidebar.expander("Roadmap Parse Errors", expanded=False):
            for err in st.session_state['roadmap_errors']:
                st.error(err)

    if page == "📍 Roadmap":
        st.header("📍 Roadmap")
        roadmap_items = parse_roadmap()
        if not roadmap_items:
            st.info("No roadmap items found.")
        else:
            for idx, fields in enumerate(roadmap_items):
                feature_title = fields.get('feature', 'Unknown')
                status = fields.get('status', 'planned').lower()
                status_color = {
                    'planned': '#e0e0e0',
                    'in_progress': '#ffe066',
                    'done': '#8fd19e',
                    'completed': '#8fd19e',
                    'backlog': '#b0b0b0',
                }.get(status, '#e0e0e0')
                id_val = fields.get('id', '—')
                priority = fields.get('priority', '—')
                file_target = fields.get('file_target', '—')
                instructions = fields.get('instructions', '')
                summary = instructions.split('.')[0] + '.' if instructions else '—'
                executed = fields.get('executed', 'No').strip().lower()
                prompt_key = f"prompt_{id_val}"
                executed_key = f"executed_{id_val}"
                reflection_key = f"reflection_{id_val}"
                # Session state for prompt and execution
                if prompt_key not in st.session_state:
                    st.session_state[prompt_key] = ''
                if executed_key not in st.session_state:
                    st.session_state[executed_key] = executed
                with st.container():
                    cols = st.columns([2, 1, 2, 3, 2])
                    # Feature name
                    cols[0].markdown(f"<b>📌 {feature_title}</b>", unsafe_allow_html=True)
                    # Status badge
                    status_label = status.replace('_', ' ').title()
                    cols[1].markdown(f'<span style="background-color:{status_color};border-radius:8px;padding:2px 10px;">{status_label}</span>', unsafe_allow_html=True)
                    # ID, Priority, File Target
                    cols[2].markdown(f"🧾 <b>ID:</b> {id_val}  ", unsafe_allow_html=True)
                    cols[2].markdown(f"<b>Priority:</b> {priority}  ", unsafe_allow_html=True)
                    cols[2].markdown(f"<b>File:</b> {file_target}", unsafe_allow_html=True)
                    # Summary
                    cols[3].markdown(f"📘 <i>{summary}</i>", unsafe_allow_html=True)
                    # Buttons
                    with cols[4]:
                        # Mark Executed
                        mark_disabled = st.session_state[executed_key] == 'yes'
                        if st.button("✔️ Mark Executed", key=f"mark_{id_val}", disabled=mark_disabled):
                            st.session_state[executed_key] = 'yes'
                            # Update roadmap file
                            roadmap_path = Path(__file__).parent.parent / "System/Reference/ea_roadmap.md"
                            content = roadmap_path.read_text()
                            new_content = re.sub(rf'(\*\*Executed:\*\*\s*)No', r'\1Yes', content, count=1)
                            roadmap_path.write_text(new_content)
                            st.success("Marked as Executed!")
                        # Generate Prompt
                        if st.button("🧠 Generate Prompt", key=f"promptbtn_{id_val}"):
                            st.session_state[prompt_key] = f"Prompt for {feature_title} (ID: {id_val})\n\n{instructions}"
                        if st.session_state[prompt_key]:
                            st.code(st.session_state[prompt_key], language='markdown')
                        # View Reflection
                        if st.button("📝 View Reflection", key=f"viewrefl_{id_val}"):
                            # Find matching reflection by roadmap_id
                            retro_dir = Path(__file__).parent.parent / "Retrospectives"
                            found = False
                            for retro_file in retro_dir.glob("*.md"):
                                content = retro_file.read_text(encoding="utf-8")
                                if f"roadmap_id: {id_val}" in content:
                                    st.markdown(f"**Reflection for {feature_title}:**")
                                    st.code(content, language='markdown')
                                    found = True
                                    break
                            if not found:
                                st.info("No linked reflection found.")
                    st.divider()

    elif page == "📥 Inbox":
        st.title("📧 Email Inbox & Flow")

        # Read and parse the email log
        log_path = "/Users/air/AIR01/System/Inbox/EmailLog.md"
        emails: list[dict[str, str]] = []
        if Path(log_path).exists():
            with open(log_path) as f:
                lines = f.readlines()
            subject: Optional[str] = None
            sender: Optional[str] = None
            date: Optional[str] = None
            link: Optional[str] = None
            for line in lines:
                if line.startswith("### 🔹 "):
                    # New email entry
                    if subject and sender and date and link:
                        emails.append(
                            {"subject": subject, "sender": sender, "date": date, "link": link}
                        )
                    # Parse subject and link
                    try:
                        subject_part = line.split("[")[1].split("]")[0]
                        link_part = line.split("(")[1].split(")")[0]
                        subject = subject_part
                        link = link_part
                    except Exception:
                        subject, link = None, None
                    sender, date = None, None
                elif line.strip().startswith("- **From**:"):
                    sender = line.split(":", 1)[1].strip()
                elif line.strip().startswith("- **Date**:"):
                    date = line.split(":", 1)[1].strip()
            # Add last email
            if subject and sender and date and link:
                emails.append({"subject": subject, "sender": sender, "date": date, "link": link})
        else:
            st.warning("No email log found.")
            emails = []

        # Show recent emails table
        st.subheader("Recent Emails")
        if emails:
            df_emails = pd.DataFrame(emails)
            df_emails["date_parsed"] = pd.to_datetime(df_emails["date"], errors="coerce")
            df_emails = df_emails.sort_values("date_parsed", ascending=False)
            show_df = df_emails.head(20)[["date_parsed", "subject", "sender", "link"]]
            show_df = show_df.rename(
                columns={
                    "date_parsed": "Date",
                    "subject": "Subject",
                    "sender": "Sender",
                    "link": "Gmail Link",
                }
            )

            # Render as table with clickable links
            def make_link(url: str) -> str:
                return f"[View]({url})"

            show_df["Gmail Link"] = show_df["Gmail Link"].apply(make_link)
            st.write(show_df.to_markdown(index=False), unsafe_allow_html=True)
        else:
            st.info("No emails to display.")

        # Show email volume chart
        st.subheader("Email Volume (per hour, last 48h)")
        if emails:
            df_emails = pd.DataFrame(emails)
            df_emails["date_parsed"] = pd.to_datetime(df_emails["date"], errors="coerce")
            now = pd.Timestamp.now()
            last_48h = now - pd.Timedelta(hours=48)
            mask = (df_emails["date_parsed"] >= last_48h) & (df_emails["date_parsed"] <= now)
            df_48h = df_emails[mask]
            if not df_48h.empty:
                df_48h["hour"] = df_48h["date_parsed"].dt.floor("h")
                hourly_counts = df_48h.groupby("hour").size().reset_index(name="Emails")
                hourly_counts = hourly_counts.set_index("hour")
                st.line_chart(hourly_counts)
            else:
                st.info("No emails in the last 48 hours.")
        else:
            st.info("No email data for chart.")

    elif page == "🧠 Ora Chat":
        st.header("🧠 Ora Chat")
        # Simple Ora Chat UI
        if "messages" not in st.session_state:
            st.session_state.messages = []
            st.session_state.messages.append(
                {"role": "system", "content": "You are Ora, a structured executive assistant."}
            )

        user_input = st.chat_input("Ask Ora anything...")

        if user_input:
            st.session_state.messages.append({"role": "user", "content": user_input})
            with st.spinner("Ora is thinking..."):
                try:
                    client = OpenAI()
                    stream = client.chat.completions.create(
                        model="gpt-4",
                        messages=st.session_state.messages,
                        temperature=0.7,
                        max_tokens=500,
                        stream=True
                    )
                    streamed_response = ""
                    response_placeholder = st.empty()
                    for chunk in stream:
                        if hasattr(chunk.choices[0].delta, 'content') and chunk.choices[0].delta.content:
                            streamed_response += chunk.choices[0].delta.content
                            response_placeholder.markdown(streamed_response)
                    st.session_state.messages.append(
                        {"role": "assistant", "content": streamed_response}
                    )
                except Exception as e:
                    st.error(f"Error: {e!s}")
                    st.session_state.messages.append(
                        {
                            "role": "assistant",
                            "content": "I apologize, but I encountered an error. Please try again.",
                        }
                    )

        for message in st.session_state.messages:
            if message["role"] == "user":
                st.chat_message("user").write(message["content"])
            elif message["role"] == "assistant":
                st.chat_message("assistant").write(message["content"])

    elif page == "📘 Reflections":
        st.header("📘 Reflections")
        retro_dir = Path(__file__).parent.parent / "Retrospectives"
        if not retro_dir.exists() or not any(retro_dir.glob("*.md")):
            st.info("No reflections yet. Complete a roadmap item to get started.")
        else:
            # Optional: Toggle for all vs tagged reflections
            show_tagged_only = st.toggle("Show only tagged reflections", value=False)
            for retro_file in sorted(retro_dir.glob("*.md")):
                content = retro_file.read_text(encoding="utf-8")
                yaml_match = re.match(r"---\n(.*?)---\n(.*)", content, re.DOTALL)
                if not yaml_match:
                    st.warning(f"Could not parse frontmatter in {retro_file.name}")
                    st.divider()
                    continue
                yaml_block = yaml_match.group(1)
                body = yaml_match.group(2).strip()
                meta = {}
                for line in yaml_block.splitlines():
                    if ':' in line:
                        k, v = line.split(':', 1)
                        meta[k.strip()] = v.strip()
                feature = meta.get('feature', retro_file.stem)
                summary_state_key = f"summary_val_{retro_file.name}"
                tag_button_key = f"tag_btn_{retro_file.name}"
                tag_state_key = f"tag_val_{retro_file.name}"
                suggest_key = f"suggest_roadmap_{retro_file.name}"
                suggested_block_key = f"suggested_block_{retro_file.name}"
                add_key = f"add_roadmap_{retro_file.name}"
                tags_in_yaml = meta.get('tags', '')
                tags_in_yaml_str = ''
                if tags_in_yaml:
                    if isinstance(tags_in_yaml, str):
                        tags_in_yaml_str = tags_in_yaml.strip()
                    elif isinstance(tags_in_yaml, list):
                        tags_in_yaml_str = ', '.join([t.strip() for t in tags_in_yaml if t.strip()])
                tags_val = st.session_state.get(tag_state_key, "")
                tags_display = tags_val or tags_in_yaml_str
                # Filter for tagged only if toggle is on
                if show_tagged_only and not tags_display:
                    continue
                # Card-style layout
                with st.container():
                    cols = st.columns([1, 2])
                    with cols[0]:
                        st.markdown(f"**ID:** {meta.get('roadmap_id', '')}")
                        st.markdown(f"**Feature:** {meta.get('feature', '')}")
                        st.markdown(f"**File Target:** {meta.get('file_target', '')}")
                        st.markdown(f"**Executed On:** {meta.get('executed_on', '')}")
                        # Tags as pill-style
                        if tags_display:
                            tag_pills = ' '.join([f'<span style="background-color:#e0e0e0;border-radius:8px;padding:2px 8px;margin-right:4px;">{t.strip()}</span>' for t in tags_display.split(",")])
                            st.markdown(f"Tags: {tag_pills}", unsafe_allow_html=True)
                    with cols[1]:
                        # --- Tag with GPT button ---
                        tag_disabled = bool(tags_display)
                        tag_help = "Tags already exist." if tag_disabled else None
                        tag_clicked = st.button(f"🏷️ Tag with GPT", key=tag_button_key, disabled=tag_disabled, help=tag_help)
                        if tag_clicked and not tag_disabled:
                            with st.spinner("Extracting tags with GPT-4..."):
                                client = OpenAI()
                                try:
                                    tag_input = st.session_state.get(summary_state_key, body)
                                    tag_prompt = (
                                        "From the following EA reflection, extract 2–4 relevant tags that summarize the key themes (e.g., #loop, #unexpected, #clarity). "
                                        "Return the tags as a comma-separated string.\n\nReflection:\n" + tag_input
                                    )
                                    tag_response = client.chat.completions.create(
                                        model="gpt-4",
                                        messages=[
                                            {"role": "system", "content": "You are a product coach extracting tags from EA reflections."},
                                            {"role": "user", "content": tag_prompt}
                                        ],
                                        temperature=0.3,
                                        max_tokens=60
                                    )
                                    tags = tag_response.choices[0].message.content.strip()
                                    st.session_state[tag_state_key] = tags
                                    st.markdown(f"**Tags:** {tags}")
                                except Exception as e:
                                    st.error(f"Tag extraction failed: {e}")
                        # --- Suggest Roadmap Item button ---
                        tags_val = st.session_state.get(tag_state_key, "")
                        tags_display = tags_val or tags_in_yaml_str
                        suggest_disabled = not bool(tags_display)
                        suggest_help = "Add tags first." if suggest_disabled else None
                        suggest_clicked = st.button("🧠 Suggest Roadmap Item", key=suggest_key, disabled=suggest_disabled, help=suggest_help)
                        if suggest_clicked and not suggest_disabled:
                            with st.spinner("Suggesting roadmap item with GPT-4..."):
                                client = OpenAI()
                                try:
                                    roadmap_prompt = (
                                        "You are a systems assistant. Given this retrospective and tags, suggest a new roadmap item if appropriate. "
                                        "Output as a markdown roadmap block including: ## Title, **ID:** (use 999), **Status:** planned, **Priority:** inferred, **File Target:** suggested_path.md, **Instructions:** explanation.\n\n"
                                        f"Reflection:\n{body}\n\nTags: {tags_display}"
                                    )
                                    roadmap_response = client.chat.completions.create(
                                        model="gpt-4",
                                        messages=[
                                            {"role": "system", "content": "You are a systems assistant."},
                                            {"role": "user", "content": roadmap_prompt}
                                        ],
                                        temperature=0.5,
                                        max_tokens=400
                                    )
                                    gpt_response = roadmap_response.choices[0].message.content.strip()
                                    st.session_state[suggested_block_key] = gpt_response
                                    if not gpt_response:
                                        st.warning("⚠️ No suggestion returned. Try updating your reflection.")
                                except Exception as e:
                                    st.warning("⚠️ No suggestion returned. Try updating your reflection.")
                        # --- Add to Roadmap button ---
                        suggested_block = st.session_state.get(suggested_block_key, "")
                        add_disabled = not bool(suggested_block)
                        add_help = "Suggest a roadmap item first." if add_disabled else None
                        st.button("📥 Add to Roadmap", key=add_key, disabled=add_disabled, help=add_help, on_click=(lambda: add_to_roadmap(suggested_block_key)) if not add_disabled else None)
                    # Markdown reflection body and details in expander
                    with st.expander("Details"):
                        st.markdown(body)
                        # Optionally show summary if available
                        if summary_state_key in st.session_state:
                            st.markdown(f"**Summary:**\n\n{st.session_state[summary_state_key]}")
                        # Show suggested roadmap block if available
                        if suggested_block:
                            st.markdown(suggested_block)
                    st.divider()

    elif page == "📊 Dashboard":
        st.header("📊 Dashboard")
        # --- Roadmap Parsing (same as 📍 Roadmap) ---
        roadmap_path = Path(__file__).parent.parent / "System/Reference/ea_roadmap.md"
        roadmap_items = []
        if roadmap_path.exists():
            content = roadmap_path.read_text()
            blocks = [b.strip() for b in content.split('##') if b.strip()]
            for block in blocks:
                lines = block.splitlines()
                feature_title = lines[0].strip() if lines else 'Unknown Feature'
                fields = {'feature': feature_title}
                for line in lines[1:]:
                    for field in ["ID", "Status", "Priority", "File Target", "Prompt Saved", "Executed", "Instructions"]:
                        m = re.search(rf"^\*\*{field}:\*\*\s*(.*)", line.strip(), re.IGNORECASE)
                        if m:
                            fields[field.lower().replace(' ', '_')] = m.group(1).strip()
                roadmap_items.append(fields)
        # --- Reflections Parsing ---
        retro_dir = Path(__file__).parent.parent / "Retrospectives"
        reflections = []
        tag_counter = {}
        if retro_dir.exists():
            for retro_file in retro_dir.glob("*.md"):
                content = retro_file.read_text(encoding="utf-8")
                yaml_match = re.match(r"---\n(.*?)---\n(.*)", content, re.DOTALL)
                if yaml_match:
                    yaml_block = yaml_match.group(1)
                    meta = {}
                    for line in yaml_block.splitlines():
                        if ':' in line:
                            k, v = line.split(':', 1)
                            meta[k.strip()] = v.strip()
                    executed_on = meta.get('executed_on', '')
                    tags = meta.get('tags', '')
                    if tags:
                        tag_list = [t.strip() for t in tags.split(',')] if isinstance(tags, str) else tags
                        for t in tag_list:
                            tag_counter[t] = tag_counter.get(t, 0) + 1
                    reflections.append({
                        'file': retro_file.name,
                        'executed_on': executed_on,
                        'tags': tags,
                        'roadmap_id': meta.get('roadmap_id', ''),
                    })
        # --- Metrics ---
        if not roadmap_items and not reflections:
            st.info("No roadmap or reflection data available.")
        else:
            # Roadmap status counts
            status_counts = {'planned': 0, 'in_progress': 0, 'done': 0}
            for item in roadmap_items:
                status = item.get('status', '').lower()
                if status in status_counts:
                    status_counts[status] += 1
            # Reflection count
            reflection_count = len(reflections)
            # Linked reflections (roadmap_id in both)
            roadmap_ids = set(item.get('id', '') for item in roadmap_items)
            linked_reflections = [r for r in reflections if r.get('roadmap_id', '') in roadmap_ids and r.get('roadmap_id', '')]
            linked_count = len(linked_reflections)
            # --- Metrics Row ---
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("Planned Items", status_counts['planned'])
            col2.metric("In Progress", status_counts['in_progress'])
            col3.metric("Done", status_counts['done'])
            col4.metric("Reflections", reflection_count)
            st.markdown(f"**Linked Reflections:** {linked_count}")
            # --- Reflections Over Time ---
            dates = [r['executed_on'] for r in reflections if r['executed_on']]
            if dates:
                df = pd.DataFrame({'executed_on': pd.to_datetime(dates, errors='coerce')})
                timeline = df.groupby('executed_on').size().reset_index(name='Reflections')
                timeline = timeline.sort_values('executed_on')
                timeline = timeline.set_index('executed_on')
                st.subheader("Reflections Over Time")
                st.bar_chart(timeline)
            # --- Tag Frequency ---
            if tag_counter:
                st.subheader("Tag Frequency in Reflections")
                tag_df = pd.DataFrame(list(tag_counter.items()), columns=["Tag", "Count"]).sort_values("Count", ascending=False)
                st.bar_chart(tag_df.set_index("Tag"))

    elif page == "📊 Reflection Insights":
        st.header("📊 Reflection Insights")
        retro_dir = Path(__file__).parent.parent / "Retrospectives"
        if not retro_dir.exists() or not any(retro_dir.glob("*.md")):
            st.info("No reflections yet. Complete a roadmap item to get started.")
        else:
            rows = []
            for retro_file in retro_dir.glob("*.md"):
                content = retro_file.read_text(encoding="utf-8")
                yaml_match = re.match(r"---\n(.*?)---\n(.*)", content, re.DOTALL)
                if yaml_match:
                    yaml_block = yaml_match.group(1)
                    meta = yaml.safe_load(yaml_block)
                    roadmap_id = meta.get("roadmap_id", "")
                    feature = meta.get("feature", "")
                    executed_on = meta.get("executed_on", "")
                    tags = meta.get("tags", "")
                    # Normalize tags to a list
                    tag_list = []
                    if tags:
                        if isinstance(tags, str):
                            tag_list = [t.strip() for t in tags.split(",") if t.strip()]
                        elif isinstance(tags, list):
                            tag_list = tags
                    rows.append({
                        "roadmap_id": roadmap_id,
                        "feature": feature,
                        "executed_on": executed_on,
                        "tags": tag_list,
                        "file": retro_file.name
                    })
            if not rows:
                st.info("No valid reflections found.")
            else:
                df = pd.DataFrame(rows)
                # Most common tags
                all_tags = [tag for tags in df["tags"] for tag in tags]
                tag_counts = Counter(all_tags)
                if tag_counts:
                    st.subheader("Most Common Tags")
                    tag_df = pd.DataFrame(tag_counts.items(), columns=["Tag", "Count"]).sort_values("Count", ascending=False)
                    st.bar_chart(tag_df.set_index("Tag"))
                else:
                    st.markdown("_No tags found in reflections._")
                # Reflections per feature
                st.subheader("Reflections per Roadmap Feature")
                feature_counts = df["feature"].value_counts().reset_index()
                feature_counts.columns = ["Feature", "Count"]
                st.dataframe(feature_counts)
                # Timeline of executed reflections
                st.subheader("Timeline of Executed Reflections")
                if df["executed_on"].notnull().any():
                    # Parse dates and count per date
                    df["executed_on_parsed"] = pd.to_datetime(df["executed_on"], errors="coerce")
                    timeline = df.groupby("executed_on_parsed").size().reset_index(name="Reflections")
                    timeline = timeline.sort_values("executed_on_parsed")
                    timeline = timeline.set_index("executed_on_parsed")
                    st.bar_chart(timeline)
                else:
                    st.markdown("_No execution dates found in reflections._")


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


# Helper for Add to Roadmap

def add_to_roadmap(suggested_block_key):
    roadmap_path = Path(__file__).parent.parent / "System/Reference/ea_roadmap.md"
    try:
        with open(roadmap_path, "a", encoding="utf-8") as f:
            f.write("\n\n" + st.session_state[suggested_block_key].strip() + "\n")
        st.toast("✅ Roadmap block added to ea_roadmap.md!", icon="✅")
    except Exception as e:
        st.error(f"Failed to add to roadmap: {e}")


@st.cache_data(show_spinner=False)
def parse_roadmap():
    roadmap_path = Path(__file__).parent.parent / "System/Reference/ea_roadmap.md"
    roadmap_items = []
    if roadmap_path.exists():
        content = roadmap_path.read_text()
        blocks = [b.strip() for b in content.split('##') if b.strip()]
        for block in blocks:
            lines = block.splitlines()
            feature_title = lines[0].strip() if lines else 'Unknown Feature'
            fields = {'feature': feature_title}
            for line in lines[1:]:
                for field in ["ID", "Status", "Priority", "File Target", "Prompt Saved", "Executed", "Instructions"]:
                    m = re.search(rf"^\*\*{field}:\*\*\s*(.*)", line.strip(), re.IGNORECASE)
                    if m:
                        fields[field.lower().replace(' ', '_')] = m.group(1).strip()
            roadmap_items.append(fields)
    return roadmap_items


if __name__ == "__main__":
    main()
