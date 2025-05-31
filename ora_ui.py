import streamlit as st
from gpt_ora_chat import run_gpt_ora_chat

st.set_page_config(page_title="Ora", page_icon="🧠", layout="wide")

# Sidebar navigation
st.sidebar.title("Ora Navigation")
page = st.sidebar.radio(
    "Go to",
    (
        "📥 Inbox",
        "📊 Dashboard",
        "🧠 Ora Chat",
        "📍 Roadmap",
        "📘 Reflections",
        "📊 Reflection Insights",
    ),
    index=2,
)

# Main area logic for each page
if page == "📥 Inbox":
    st.header("📥 Inbox")
    st.info("This is your Inbox. (Stub page)")

elif page == "📊 Dashboard":
    import os
    import frontmatter
    from pathlib import Path
    import traceback
    import pandas as pd
    import altair as alt

    st.header("📊 Dashboard")

    # Load all reflections
    reflections_dir = Path("Retrospectives")
    reflections = []
    if reflections_dir.exists():
        for md_file in sorted(reflections_dir.glob("*.md")):
            try:
                post = frontmatter.load(md_file)
                reflections.append({
                    "filename": md_file.name,
                    "roadmap_id": post.get("roadmap_id", None),
                    "feature": post.get("feature", None),
                    "executed_on": post.get("executed_on", None),
                    "tags": post.get("tags", []),
                })
            except Exception as e:
                st.error(f"Failed to load {md_file.name}: {e}")
                st.code(traceback.format_exc())
    else:
        st.warning(f"Reflections directory `{reflections_dir}` does not exist.")

    # Load all roadmap items
    roadmap_dir = Path("Roadmap")
    roadmap_items = []
    roadmap_id_to_title = {}
    if roadmap_dir.exists():
        for md_file in sorted(roadmap_dir.glob("*.md")):
            try:
                post = frontmatter.load(md_file)
                rid = post.get("id", None)
                title = post.get("title", os.path.splitext(md_file.name)[0])
                roadmap_items.append({
                    "id": rid,
                    "title": title,
                })
                if rid:
                    roadmap_id_to_title[rid] = title
            except Exception as e:
                continue

    # Summarize counts
    total_reflections = len(reflections)
    linked_reflections = [r for r in reflections if r["roadmap_id"]]
    num_linked = len(linked_reflections)
    orphaned_reflections = [r for r in reflections if not r["roadmap_id"]]
    num_orphaned = len(orphaned_reflections)
    executed_reflections = [r for r in reflections if r["executed_on"]]
    num_executed = len(executed_reflections)

    # Summarize reflections per roadmap feature
    feature_counts = {}
    for r in linked_reflections:
        rid = r["roadmap_id"]
        feature = roadmap_id_to_title.get(rid, rid if rid else "Unknown")
        feature_counts[feature] = feature_counts.get(feature, 0) + 1

    # Display summary
    st.subheader("Summary")
    cols = st.columns(4)
    cols[0].metric("Total Reflections", total_reflections)
    cols[1].metric("Linked to Roadmap", num_linked)
    cols[2].metric("Orphaned Reflections", num_orphaned)
    cols[3].metric("With 'executed_on'", num_executed)

    # Display bar chart of reflection counts per roadmap feature
    st.subheader("Reflections per Roadmap Feature")
    if feature_counts:
        df = pd.DataFrame([
            {"Feature": k, "Reflection Count": v}
            for k, v in feature_counts.items()
        ])
        chart = alt.Chart(df).mark_bar().encode(
            x=alt.X('Feature:N', sort='-y', title="Roadmap Feature"),
            y=alt.Y('Reflection Count:Q', title="Number of Reflections"),
            tooltip=["Feature", "Reflection Count"]
        ).properties(width=600, height=400)
        st.altair_chart(chart, use_container_width=True)
    else:
        st.info("No reflections are linked to roadmap features yet.")

elif page == "🧠 Ora Chat":
    st.title("🧠 Ora Chat")
    query = st.text_input("Ask Ora", placeholder="e.g. What should I focus on today?")
    if st.button("Submit", key="chat_submit") and query:
        try:
            loop_summaries = []
            response = run_gpt_ora_chat(query, loop_summaries)
            st.markdown("**Ora says:**")
            st.write(response)
        except Exception as e:
            st.error(f"Something went wrong: {e}")

elif page == "📍 Roadmap":
    import os
    import frontmatter
    from pathlib import Path
    import traceback
    import textwrap

    st.header("📍 Roadmap")

    def load_roadmap_items():
        roadmap_dir = Path("Roadmap")
        items = []
        if not roadmap_dir.exists():
            return items
        for md_file in sorted(roadmap_dir.glob("*.md")):
            try:
                post = frontmatter.load(md_file)
                content = post.content.strip() if hasattr(post, "content") else ""
                item = {
                    "filename": md_file.name,
                    "title": post.get("title", os.path.splitext(md_file.name)[0]),
                    "status": post.get("status", "Unknown"),
                    "id": post.get("id", None),
                    "priority": post.get("priority", None),
                    "file_target": post.get("file_target", None),
                    "instructions": post.get("instructions", ""),
                    "content": content,
                }
                items.append(item)
            except Exception as e:
                st.error(f"Failed to load {md_file.name}: {e}")
                st.code(traceback.format_exc())
        return items

    def count_reflections_for_roadmap_id(roadmap_id):
        reflections_dir = Path("Retrospectives")
        if not reflections_dir.exists():
            return 0
        count = 0
        for md_file in reflections_dir.glob("*.md"):
            try:
                post = frontmatter.load(md_file)
                if post.get("roadmap_id", None) == roadmap_id:
                    count += 1
            except Exception:
                continue
        return count

    roadmap_items = load_roadmap_items()
    if not roadmap_items:
        st.info("No roadmap items found in Roadmap/.")
    else:
        for item in roadmap_items:
            with st.container():
                # Header with title and status badge
                cols = st.columns([5, 1])
                with cols[0]:
                    st.subheader(item["title"])
                with cols[1]:
                    status = item.get("status", "Unknown")
                    status_colors = {
                        "Done": "green",
                        "In Progress": "orange",
                        "Planned": "gray",
                        "Blocked": "red",
                        "Unknown": "gray",
                    }
                    color = status_colors.get(status, "gray")
                    st.markdown(
                        f'<span style="background-color:{color};color:white;padding:4px 12px;border-radius:12px;font-size:0.9em;">{status}</span>',
                        unsafe_allow_html=True,
                    )
                # Meta info row
                meta_pieces = []
                if item.get("id"):
                    meta_pieces.append(f"**ID:** `{item['id']}`")
                if item.get("priority"):
                    meta_pieces.append(f"**Priority:** `{item['priority']}`")
                if item.get("file_target"):
                    meta_pieces.append(f"**File:** `{item['file_target']}`")
                if meta_pieces:
                    st.markdown(" &nbsp; | &nbsp; ".join(meta_pieces))
                # Instructions summary (first 2 lines or 200 chars)
                instructions = item.get("instructions", "")
                if instructions:
                    summary = "\n".join(textwrap.wrap(instructions, width=80)[:2])
                    if len(instructions) > 200:
                        summary = instructions[:200] + "..."
                    st.markdown(f"**Instructions:** {summary}")
                # Linked reflections count
                rid = item.get("id")
                if rid:
                    reflection_count = count_reflections_for_roadmap_id(rid)
                    st.write(f"🔗 **Linked Reflections:** {reflection_count}")
                # Buttons row
                bcols = st.columns(2)
                with bcols[0]:
                    if st.button("🧠 Generate Prompt", key=f"genprompt_{item.get('id', item['filename'])}"):
                        st.info(f"(Stub) Would generate prompt for feature: {item['title']}")
                with bcols[1]:
                    if st.button("📝 View Reflection", key=f"viewreflection_{item.get('id', item['filename'])}"):
                        st.info(f"(Stub) Would show reflections for feature: {item['title']}")
            st.markdown("---")

elif page == "📘 Reflections":
    import os
    import frontmatter
    from pathlib import Path
    import traceback

    st.header("📘 Reflections")
    reflections_dir = Path("Retrospectives")
    if not reflections_dir.exists():
        st.warning(f"Reflections directory `{reflections_dir}` does not exist.")
    else:
        md_files = sorted(reflections_dir.glob("*.md"))
        if not md_files:
            st.info("No reflection files found in Retrospectives/.")
        else:
            for md_file in md_files:
                try:
                    post = frontmatter.load(md_file)
                except Exception as e:
                    st.error(f"Failed to load {md_file.name}: {e}")
                    st.code(traceback.format_exc())
                    continue
                # Filename as header
                st.subheader(md_file.name)

                # Tags as inline code pills
                tags = post.get('tags', [])
                if tags and isinstance(tags, (list, tuple)):
                    st.write("Tags:", " ".join(f"`{tag}`" for tag in tags))
                elif tags:
                    st.write(f"Tags: `{tags}`")

                # Roadmap ID, Feature, Executed On fields
                roadmap_id = post.get('roadmap_id', None)
                feature = post.get('feature', None)
                executed_on = post.get('executed_on', None)
                meta_items = []
                if roadmap_id:
                    meta_items.append(f"**Roadmap ID:** `{roadmap_id}`")
                if feature:
                    meta_items.append(f"**Feature:** `{feature}`")
                if executed_on:
                    meta_items.append(f"**Executed On:** `{executed_on}`")
                if meta_items:
                    st.markdown(" &nbsp; | &nbsp; ".join(meta_items))

                # Body rendered in Markdown
                body = post.content.strip() if hasattr(post, "content") else ""
                if body:
                    st.markdown(body)
                else:
                    st.info("No reflection content.")
                st.markdown("---")

elif page == "📊 Reflection Insights":
    import os
    import frontmatter
    from pathlib import Path
    import traceback
    import pandas as pd
    import altair as alt
    from collections import Counter, defaultdict
    import datetime

    st.header("📊 Reflection Insights")

    reflections_dir = Path("Retrospectives")
    tag_counter = Counter()
    executed_dates = []
    tag_reflections = []

    if not reflections_dir.exists():
        st.warning(f"Reflections directory `{reflections_dir}` does not exist.")
    else:
        md_files = sorted(reflections_dir.glob("*.md"))
        if not md_files:
            st.info("No reflection files found in Retrospectives/.")
        else:
            for md_file in md_files:
                try:
                    post = frontmatter.load(md_file)
                except Exception as e:
                    st.error(f"Failed to load {md_file.name}: {e}")
                    st.code(traceback.format_exc())
                    continue
                # Tags
                tags = post.get("tags", [])
                if isinstance(tags, str):
                    tags = [tags]
                if tags:
                    tag_counter.update(tags)
                    tag_reflections.append({"filename": md_file.name, "tags": tags})
                # Executed on
                executed_on = post.get("executed_on", None)
                if executed_on:
                    # Try to parse date
                    try:
                        dt = pd.to_datetime(executed_on)
                        executed_dates.append(dt)
                    except Exception:
                        # Skip if can't parse
                        continue

        # --------- Tag Frequency Bar Chart -----------
        st.subheader("Most Frequent Tags")
        if tag_counter:
            tag_df = pd.DataFrame(tag_counter.most_common(), columns=["Tag", "Count"])
            chart = alt.Chart(tag_df).mark_bar().encode(
                x=alt.X("Tag:N", sort='-y', title="Tag"),
                y=alt.Y("Count:Q", title="Number of Occurrences"),
                tooltip=["Tag", "Count"]
            ).properties(width=600, height=400)
            st.altair_chart(chart, use_container_width=True)
        else:
            st.info("No tags found in reflections.")

        # --------- Reflection Volume Over Time (by week) -----------
        st.subheader("Reflection Volume Over Time (by Week)")
        if executed_dates:
            # Create a DataFrame of all dates, group by week
            df = pd.DataFrame({"executed_on": executed_dates})
            df["week"] = df["executed_on"].dt.to_period("W").apply(lambda r: r.start_time)
            volume_by_week = df.groupby("week").size().reset_index(name="Reflection Count")
            volume_by_week = volume_by_week.sort_values("week")
            chart2 = alt.Chart(volume_by_week).mark_line(point=True).encode(
                x=alt.X("week:T", title="Week"),
                y=alt.Y("Reflection Count:Q", title="Number of Reflections"),
                tooltip=["week", "Reflection Count"]
            ).properties(width=600, height=400)
            st.altair_chart(chart2, use_container_width=True)
        else:
            st.info("No 'executed_on' dates found in reflections.")