import json
from pathlib import Path

import openai
import pandas as pd
import streamlit as st
from gpt_supervised.config import OPENAI_API_KEY

openai.api_key = OPENAI_API_KEY


def main():
    st.set_page_config(page_title="Cursor Dashboard", layout="wide")

    # Store page config in session state for testing
    st.session_state["page_title"] = "Cursor Dashboard"
    st.session_state["page_icon"] = "🤖"
    st.session_state["layout"] = "wide"

    # Sidebar navigation
    st.sidebar.title("Navigation")
    page = st.sidebar.radio("Go to", ["Roadmap", "Ora Chat", "Analytics", "Inbox"])

    if page == "Analytics":
        st.header("Analytics Dashboard")
        # Placeholder for analytics content
        st.write("Analytics content coming soon...")

    elif page == "Roadmap":
        st.header("Roadmap")
        # Placeholder for roadmap content
        st.write("Roadmap content coming soon...")

    elif page == "Inbox":
        st.header("Inbox")
        # Placeholder for inbox content
        st.write("Inbox content coming soon...")

    elif page == "Ora Chat":
        st.header("Ora Chat")
        # Simple Ora Chat UI
        if "messages" not in st.session_state:
            st.session_state.messages = []
            st.session_state.messages.append({
                "role": "system",
                "content": "You are Ora, a structured executive assistant."
            })

        user_input = st.chat_input("Ask Ora anything...")

        if user_input:
            st.session_state.messages.append({"role": "user", "content": user_input})
            with st.spinner("Ora is thinking..."):
                try:
                    response = openai.ChatCompletion.create(
                        model="gpt-4",
                        messages=st.session_state.messages
                    )
                    assistant_message = response['choices'][0]['message']['content']
                    st.session_state.messages.append(
                        {"role": "assistant", "content": assistant_message}
                    )
                except Exception as e:
                    st.error(f"Error: {str(e)}")
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": "I apologize, but I encountered an error. Please try again."
                    })

        for message in st.session_state.messages:
            if message["role"] == "user":
                st.chat_message("user").write(message["content"])
            elif message["role"] == "assistant":
                st.chat_message("assistant").write(message["content"])


if __name__ == "__main__":
    main()
