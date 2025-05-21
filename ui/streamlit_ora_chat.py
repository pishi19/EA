import streamlit as st
import sys
import os

# Ensure access to parent directory
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from config import OPENAI_API_KEY
from load_loops_for_prompt import get_recent_loops, format_loops_for_prompt
from openai import OpenAI

client = OpenAI(api_key=OPENAI_API_KEY)

st.set_page_config(page_title="Ora Assistant", layout="wide")

# Title
st.title("💬 Ora Chat Interface")

# Load loop memory once
loop_context = format_loops_for_prompt(get_recent_loops())

# Chat UI
st.subheader("Talk to Ora")
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

chat_input = st.text_input("Ask Ora something:", key="chat_input")

if chat_input and (not st.session_state.chat_history or chat_input != st.session_state.chat_history[-2][1]):
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are Ora, a reflective executive assistant who incorporates historical loops into her thinking."
                },
                {
                    "role": "system",
                    "content": f"Context from recent memory loops:\n{loop_context}"
                },
                {
                    "role": "user",
                    "content": chat_input
                }
            ],
            temperature=0.7,
            max_tokens=500,
        )
        reply = response.choices[0].message.content.strip()
    except Exception as e:
        reply = f"⚠️ GPT Error: {e}"

    st.session_state.chat_history.append(("You", chat_input))
    st.session_state.chat_history.append(("Ora", reply))
    st.rerun()

# Display chat history
for speaker, msg in reversed(st.session_state.chat_history[-10:]):
    st.markdown(f"**{speaker}:** {msg}")

# Divider
st.divider()

# System Panels
st.header("🧠 Loop Dashboard")
st.markdown("Here you’ll eventually see metrics, loop summaries, and logic patch history.")

st.header("📋 Task & Signal Panels")
st.markdown("Task triage, patch approvals, and loop feedback will appear here.")
