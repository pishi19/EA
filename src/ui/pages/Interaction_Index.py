import os
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

import pandas as pd
import streamlit as st
import yaml

# Try to import plotly, fall back to basic charts if not available
try:
    import plotly.express as px
    import plotly.graph_objects as go
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False

st.set_page_config(page_title="Interaction Index", layout="wide")
st.title("📊 Interaction Index Dashboard")
st.caption("Complete timeline and analytics of all Ora-user interactions")

# --- Path Resolution ---
try:
    PROJECT_ROOT = Path(__file__).resolve().parents[3]
except IndexError:
    PROJECT_ROOT = Path.cwd()

interactions_dir = PROJECT_ROOT / "runtime/interactions"

# --- Helper Functions ---

def parse_interaction_file(filepath: Path) -> Dict[str, Any]:
    """Parse a single interaction markdown file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split frontmatter and content
        if content.startswith('---\n'):
            parts = content.split('---\n', 2)
            if len(parts) >= 3:
                frontmatter_str = parts[1]
                body = parts[2]
                
                # Parse frontmatter
                frontmatter = yaml.safe_load(frontmatter_str)
                
                # Extract message and outcome from body
                message_match = re.search(r'## 💬 Message\s*\n(.*?)(?=\n## |$)', body, re.DOTALL)
                outcome_match = re.search(r'## 🔄 Outcome\s*\n(.*?)(?=\n## |$)', body, re.DOTALL)
                
                message = message_match.group(1).strip() if message_match else ""
                outcome = outcome_match.group(1).strip() if outcome_match else ""
                
                # Add parsed content
                frontmatter['message'] = message
                frontmatter['outcome'] = outcome
                frontmatter['filename'] = filepath.name
                
                # Parse timestamp
                if 'timestamp' in frontmatter:
                    try:
                        frontmatter['parsed_timestamp'] = pd.to_datetime(frontmatter['timestamp'])
                    except:
                        frontmatter['parsed_timestamp'] = None
                
                # Extract phase from tags if available
                phase = None
                if 'tags' in frontmatter and isinstance(frontmatter['tags'], list):
                    for tag in frontmatter['tags']:
                        if isinstance(tag, str) and tag.startswith('phase-'):
                            phase = tag
                            break
                frontmatter['phase'] = phase
                
                # Extract workstream info
                workstream = None
                if 'context' in frontmatter:
                    context = frontmatter['context']
                    if 'loop-' in context:
                        workstream = 'loop'
                    elif 'task-' in context:
                        workstream = 'task'
                    elif 'phase-' in context:
                        workstream = 'phase'
                frontmatter['workstream'] = workstream
                
                return frontmatter
    except Exception as e:
        st.warning(f"Error parsing {filepath.name}: {e}")
        return None
    return None

@st.cache_data
def load_all_interactions() -> pd.DataFrame:
    """Load and parse all interaction files."""
    if not interactions_dir.exists():
        return pd.DataFrame()
    
    interactions = []
    interaction_files = list(interactions_dir.glob("interaction-*.md"))
    
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    for i, filepath in enumerate(interaction_files):
        status_text.text(f"Loading {filepath.name}...")
        progress_bar.progress((i + 1) / len(interaction_files))
        
        parsed = parse_interaction_file(filepath)
        if parsed:
            interactions.append(parsed)
    
    progress_bar.empty()
    status_text.empty()
    
    if not interactions:
        return pd.DataFrame()
    
    df = pd.DataFrame(interactions)
    
    # Sort by timestamp descending (newest first)
    if 'parsed_timestamp' in df.columns:
        df = df.sort_values('parsed_timestamp', ascending=False)
    
    return df

# --- Data Loading ---
st.subheader("📥 Loading Interaction Data")

if not interactions_dir.exists():
    st.error(f"Interactions directory not found: {interactions_dir}")
    st.stop()

# Count total files
total_files = len(list(interactions_dir.glob("interaction-*.md")))
st.info(f"Found {total_files} interaction files")

if total_files == 0:
    st.warning("No interaction files found. Start using the system to generate interactions!")
    st.stop()

# Load data
df = load_all_interactions()

if df.empty:
    st.error("Failed to parse any interaction files")
    st.stop()

st.success(f"Successfully loaded {len(df)} interactions")

# --- Summary Metrics ---
st.subheader("📈 Summary Metrics")

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("Total Interactions", len(df))

with col2:
    user_count = len(df[df['actor'] == 'user']) if 'actor' in df.columns else 0
    ora_count = len(df[df['actor'] == 'ora']) if 'actor' in df.columns else 0
    user_ratio = round(user_count / len(df) * 100, 1) if len(df) > 0 else 0
    st.metric("User Interactions", f"{user_count} ({user_ratio}%)")

with col3:
    ora_ratio = round(ora_count / len(df) * 100, 1) if len(df) > 0 else 0
    st.metric("Ora Interactions", f"{ora_count} ({ora_ratio}%)")

with col4:
    unique_contexts = df['context'].nunique() if 'context' in df.columns else 0
    st.metric("Unique Contexts", unique_contexts)

# --- Visualizations ---
st.subheader("📊 Interaction Analytics")

# Timeline chart
if 'parsed_timestamp' in df.columns and not df['parsed_timestamp'].isna().all():
    if PLOTLY_AVAILABLE:
        fig_timeline = px.scatter(
            df, 
            x='parsed_timestamp', 
            y='actor',
            color='source',
            hover_data=['context', 'uuid'],
            title="Interaction Timeline",
            labels={'parsed_timestamp': 'Timestamp', 'actor': 'Actor'}
        )
        fig_timeline.update_layout(height=400)
        st.plotly_chart(fig_timeline, use_container_width=True)
    else:
        st.subheader("Interaction Timeline")
        timeline_df = df.groupby(['parsed_timestamp', 'actor']).size().reset_index(name='count')
        st.line_chart(timeline_df.set_index('parsed_timestamp')['count'])

# Actor distribution
if 'actor' in df.columns:
    col1, col2 = st.columns(2)
    
    with col1:
        actor_counts = df['actor'].value_counts()
        if PLOTLY_AVAILABLE:
            fig_pie = px.pie(
                values=actor_counts.values, 
                names=actor_counts.index,
                title="Actor Distribution"
            )
            st.plotly_chart(fig_pie, use_container_width=True)
        else:
            st.subheader("Actor Distribution")
            st.bar_chart(actor_counts)
    
    with col2:
        if 'source' in df.columns:
            source_counts = df['source'].value_counts()
            if PLOTLY_AVAILABLE:
                fig_bar = px.bar(
                    x=source_counts.index,
                    y=source_counts.values,
                    title="Interactions by Source",
                    labels={'x': 'Source', 'y': 'Count'}
                )
                st.plotly_chart(fig_bar, use_container_width=True)
            else:
                st.subheader("Interactions by Source")
                st.bar_chart(source_counts)

# Phase breakdown
if 'phase' in df.columns:
    phase_counts = df[df['phase'].notna()]['phase'].value_counts()
    if not phase_counts.empty:
        st.subheader("📊 Interactions by Phase")
        if PLOTLY_AVAILABLE:
            fig_phase = px.bar(
                x=phase_counts.index,
                y=phase_counts.values,
                title="Phase Interaction Counts",
                labels={'x': 'Phase', 'y': 'Count'}
            )
            fig_phase.update_xaxes(tickangle=45)
            st.plotly_chart(fig_phase, use_container_width=True)
        else:
            st.bar_chart(phase_counts)

# --- Filtering Controls ---
st.subheader("🔍 Filter Interactions")

col1, col2, col3, col4 = st.columns(4)

with col1:
    actor_filter = st.multiselect(
        "Actor",
        options=df['actor'].unique() if 'actor' in df.columns else [],
        default=[]
    )

with col2:
    source_filter = st.multiselect(
        "Source",
        options=df['source'].unique() if 'source' in df.columns else [],
        default=[]
    )

with col3:
    phase_filter = st.multiselect(
        "Phase",
        options=df[df['phase'].notna()]['phase'].unique() if 'phase' in df.columns else [],
        default=[]
    )

with col4:
    workstream_filter = st.multiselect(
        "Workstream",
        options=df[df['workstream'].notna()]['workstream'].unique() if 'workstream' in df.columns else [],
        default=[]
    )

# Apply filters
filtered_df = df.copy()

if actor_filter:
    filtered_df = filtered_df[filtered_df['actor'].isin(actor_filter)]
if source_filter:
    filtered_df = filtered_df[filtered_df['source'].isin(source_filter)]
if phase_filter:
    filtered_df = filtered_df[filtered_df['phase'].isin(phase_filter)]
if workstream_filter:
    filtered_df = filtered_df[filtered_df['workstream'].isin(workstream_filter)]

st.info(f"Showing {len(filtered_df)} of {len(df)} interactions")

# --- Timeline View ---
st.subheader("📅 Interaction Timeline")

for _, interaction in filtered_df.iterrows():
    with st.expander(
        f"[{interaction.get('actor', 'unknown').upper()}] {interaction.get('timestamp', 'No timestamp')} - {interaction.get('context', 'No context')}"
    ):
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.markdown("**💬 Message:**")
            message = interaction.get('message', 'No message content')
            st.write(message[:500] + "..." if len(message) > 500 else message)
            
            if interaction.get('outcome'):
                st.markdown("**🔄 Outcome:**")
                outcome = interaction.get('outcome', 'No outcome recorded')
                st.write(outcome[:300] + "..." if len(outcome) > 300 else outcome)
        
        with col2:
            st.markdown("**📋 Metadata:**")
            st.code(f"""
UUID: {interaction.get('uuid', 'N/A')}
Actor: {interaction.get('actor', 'N/A')}
Source: {interaction.get('source', 'N/A')}
Context: {interaction.get('context', 'N/A')}
Phase: {interaction.get('phase', 'N/A')}
Workstream: {interaction.get('workstream', 'N/A')}
            """)
            
            if interaction.get('tags'):
                st.markdown("**🏷️ Tags:**")
                tags = interaction.get('tags', [])
                if isinstance(tags, list):
                    for tag in tags[:5]:  # Show first 5 tags
                        st.caption(f"• {tag}")

# --- Export Options ---
st.subheader("📤 Export Data")

col1, col2 = st.columns(2)

with col1:
    if st.button("Download Filtered Data as CSV"):
        csv = filtered_df.to_csv(index=False)
        st.download_button(
            label="Download CSV",
            data=csv,
            file_name=f"ora_interactions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
            mime="text/csv"
        )

with col2:
    if st.button("Show Raw Data Table"):
        st.dataframe(filtered_df, use_container_width=True) 