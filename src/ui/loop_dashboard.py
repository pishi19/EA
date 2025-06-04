import streamlit as st
import pandas as pd
from pathlib import Path
import yaml
import re

# Define the path to the loops directory
LOOPS_DIR = Path("/root/ea_cursor_system_coupled/runtime/loops/")

def load_loop_data():
    """Loads all loop data from markdown files in the LOOPS_DIR."""
    loop_files = list(LOOPS_DIR.glob("loop-*.md"))
    all_loops_data = []

    for loop_file in loop_files:
        try:
            with open(loop_file, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Extract YAML frontmatter
            match = re.match(r"---(.*?)---", content, re.DOTALL)
            if match:
                frontmatter_str = match.group(1)
                try:
                    frontmatter = yaml.safe_load(frontmatter_str)
                    if isinstance(frontmatter, dict):
                        # Ensure all expected keys are present, providing defaults if not
                        loop_data = {
                            "title": frontmatter.get("title", "N/A"),
                            "uuid": frontmatter.get("uuid", "N/A"),
                            "tags": frontmatter.get("tags", []),
                            "score": frontmatter.get("score", 0),
                            "status": frontmatter.get("status", "N/A"),
                            "filename": loop_file.name,
                        }
                        all_loops_data.append(loop_data)
                    else:
                        print(f"Warning: Frontmatter in {loop_file.name} is not a dictionary. Skipping.")
                except yaml.YAMLError as e:
                    print(f"Error parsing YAML in {loop_file.name}: {e}")
            else:
                print(f"Warning: No YAML frontmatter found in {loop_file.name}. Skipping.")
        except Exception as e:
            print(f"Error reading or processing file {loop_file.name}: {e}")
            
    return all_loops_data

def display_loops():
    """Displays the loops in the Streamlit UI."""
    st.set_page_config(page_title="Loop Dashboard", layout="wide")
    st.title("🌀 Loop Dashboard")

    loops_data = load_loop_data()

    if not loops_data:
        st.warning("No loop files found or processed in `runtime/loops/`. Please ensure markdown files with YAML frontmatter exist.")
        return

    df = pd.DataFrame(loops_data)
    
    # Reorder columns for better readability
    columns_order = ["title", "uuid", "status", "score", "tags", "filename"]
    # Filter out any columns that might not exist if all files had issues
    df_display = df[[col for col in columns_order if col in df.columns]]

    st.subheader("All Loops")
    
    if not df_display.empty:
        st.dataframe(df_display, use_container_width=True)
        
        st.subheader("Loop Details")
        if "title" in df_display.columns:
            selected_loop_title = st.selectbox("Select a loop to view details:", options=df_display["title"].unique())
            selected_loop_data = df[df["title"] == selected_loop_title].iloc[0].to_dict()
            
            if selected_loop_data:
                st.markdown(f"**Title:** {selected_loop_data.get('title', 'N/A')}")
                st.markdown(f"**UUID:** {selected_loop_data.get('uuid', 'N/A')}")
                st.markdown(f"**Status:** {selected_loop_data.get('status', 'N/A')}")
                st.markdown(f"**Score:** {selected_loop_data.get('score', 0)}")
                st.markdown(f"**Tags:** {', '.join(selected_loop_data.get('tags', [])) if selected_loop_data.get('tags') else 'N/A'}")
                st.markdown(f"**Filename:** {selected_loop_data.get('filename', 'N/A')}")
        else:
            st.info("No loop titles available for selection.")
            
    else:
        st.info("No data to display. Check the `runtime/loops/` directory and file contents.")


if __name__ == "__main__":
    display_loops() 