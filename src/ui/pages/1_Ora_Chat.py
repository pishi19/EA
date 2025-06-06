import sys
from pathlib import Path
from typing import Optional

import streamlit as st
from dotenv import load_dotenv
from openai import OpenAI

# Add project root to sys.path to resolve imports
project_root = Path(__file__).resolve().parents[3]
if str(project_root) not in sys.path:
    sys.path.append(str(project_root))

from src.semantic.loop_mutations import promote_loop_to_roadmap, tag_loop_feedback
from src.semantic.memory_injection import (
    format_loops_for_prompt,
    get_top_k_loops_for_query,
)

load_dotenv()

def handle_slash_command(message: str) -> Optional[str]:
    parts = message.strip().split()
    if not parts or not parts[0].startswith("/"):
        return None
    cmd = parts[0].lower()
    if cmd == "/promote" and len(parts) == 2:
        success = promote_loop_to_roadmap(parts[1])
        return f"✅ Promoted loop {parts[1]}" if success else f"❌ Could not promote loop {parts[1]}"
    elif cmd == "/feedback" and len(parts) == 3:
        success = tag_loop_feedback(parts[2], parts[1]) # Corrected order: uuid, tag
        return f"🏷️ Tagged '{parts[1]}' on loop {parts[2]}" if success else f"❌ Could not tag feedback on loop {parts[2]}"
    return f"⚠️ Unknown or malformed command: {message}"

def render_chat_view():
    st.title("🤖 Ora Chat")

    if "messages" not in st.session_state:
        st.session_state.messages = []

    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    if prompt := st.chat_input("Send a message or type a command..."):
        # Display user message
        with st.chat_message("user"):
            st.markdown(prompt)
        st.session_state.messages.append({"role": "user", "content": prompt})

        # Handle slash commands
        cmd_response = handle_slash_command(prompt)
        if cmd_response:
            with st.chat_message("assistant"):
                st.markdown(cmd_response)
            st.session_state.messages.append({"role": "assistant", "content": cmd_response})
            st.rerun()
            return

        # Proceed with AI response
        with st.chat_message("assistant"):
            message_placeholder = st.empty()
            full_response = ""
            try:
                top_loops = get_top_k_loops_for_query(prompt, k=3)
                memory_context = format_loops_for_prompt(top_loops) if top_loops else ""

                system_prompt = "You are Ora, a helpful AI assistant."
                if memory_context.strip():
                    system_prompt += f"\n\n[Relevant Information Retrieved from Your Loops]\n{memory_context.strip()}"

                messages_for_api = [{"role": "system", "content": system_prompt}]
                messages_for_api.extend(st.session_state.messages[-10:])

                client = OpenAI()
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=messages_for_api
                )
                full_response = response.choices[0].message.content.strip()
                message_placeholder.markdown(full_response)

            except Exception as e:
                full_response = f"An error occurred: {e}"
                st.error(full_response)

            if full_response:
                st.session_state.messages.append({"role": "assistant", "content": full_response})

# --- Main app execution ---
render_chat_view()
