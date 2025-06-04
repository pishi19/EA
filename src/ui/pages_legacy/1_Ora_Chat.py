import sys
import os

# Add the project root to sys.path to allow 'from src...' imports
# This script is in src/ui/pages_legacy/, so root is ../../../
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# ✨ Create Ora Chat as a modular Streamlit page using recovered assistant logic
import streamlit as st
from pathlib import Path # Only needed if creating the file, not for the streamlit app logic itself here

# Assuming these helper modules exist in src/ui/
# If they are in different locations, these imports will need adjustment.
# from src.ui.gpt_ora_chat import run_gpt_ora_chat # Not used in the current version of the script
from src.ui.loop_writer import get_recent_loops, format_loops_for_prompt

st.set_page_config(page_title="Ora Chat", layout="wide") # Added layout for consistency

st.title("💬 Ora Chat Interface")

# Attempt to load loop context, handle potential errors if helpers are missing/fail
try:
    # loop_context is prepared but not explicitly used in the direct OpenAI call in this version.
    # It would typically be added to the system prompt or as part of the user's message.
    loop_context = format_loops_for_prompt(get_recent_loops())
    if loop_context:
        # st.sidebar.expander("Loop Context for Assistant").text(loop_context) # Optional: display context
        pass # loop_context is available if needed to be injected into prompts
except ImportError as e:
    st.sidebar.warning(f"Could not load loop context modules (e.g., loop_writer): {e}")
    loop_context = "" # Default to empty if helpers are missing
except Exception as e:
    st.sidebar.error(f"Error loading loop context: {e}")
    loop_context = ""

st.subheader("Talk to Ora")

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

# Use a form for chat input to better handle submission
with st.form(key="chat_form", clear_on_submit=True):
    user_input = st.text_input("Ask Ora something:", key="user_chat_input", placeholder="Type your message here...")
    submit_button = st.form_submit_button(label='Send')

if submit_button and user_input:
    # Add user message to history immediately
    st.session_state.chat_history.append(("user", user_input))
    
    # Prepend loop_context to the user's input if available and desired
    # This is one way to inject context. Another is modifying the system prompt.
    # query_with_context = f"{loop_context}\n\nUser: {user_input}" # Example
    # For now, we use the user_input directly as per the original script structure.

    from openai import OpenAI # Ensure OpenAI is imported here if not globally
    try:
        client = OpenAI() # Assumes OPENAI_API_KEY is in environment
        response = client.chat.completions.create(
            model="gpt-4", # Or your preferred model
            messages=[
                {"role": "system", "content": "You are Ora, a reflective executive assistant. Incorporate insights from provided loop context if available into your thinking. Be concise and helpful."},
                # Example of how to add previous chat history for context:
                # *[{"role": role, "content": msg} for role, msg in st.session_state.chat_history[-6:-1]], # Last 5 messages (excl current user)
                {"role": "user", "content": user_input} # Current user input
            ]
        )
        answer = response.choices[0].message.content
        st.session_state.chat_history.append(("assistant", answer))
        st.rerun() # Rerun to update the display immediately after getting the response
    except Exception as e:
        st.error(f"OpenAI API Error: {e}")
        # Optionally remove the user's last message if API call failed to prevent resubmission issues
        # if st.session_state.chat_history and st.session_state.chat_history[-1][0] == "user":
        #     st.session_state.chat_history.pop()

# Display chat history
if st.session_state.chat_history:
    for role, msg in st.session_state.chat_history:
        if role == "user":
            st.markdown(f"<div style='text-align: right; margin-left: 20%; margin-bottom: 5px; background-color: #D6EAF8; padding: 10px; border-radius: 10px;'>🧑‍💻 **You:**<br>{msg}</div>", unsafe_allow_html=True)
        else:
            st.markdown(f"<div style='margin-right: 20%; margin-bottom: 5px; background-color: #E8F8F5; padding: 10px; border-radius: 10px;'>🧠 **Ora:**<br>{msg}</div>", unsafe_allow_html=True)
else:
    st.info("Your chat with Ora will appear here.")

# To manage chat history length (optional)
# MAX_HISTORY_LENGTH = 20 
# if len(st.session_state.chat_history) > MAX_HISTORY_LENGTH:
#     st.session_state.chat_history = st.session_state.chat_history[-MAX_HISTORY_LENGTH:] 