def render():
    import streamlit as st
    import openai

    # 🔑 Load your OpenAI key (assumes it's already working in other scripts)
    import os
    openai.api_key = os.getenv("OPENAI_API_KEY")

    st.title("💬 Chat with Ora")

    # Initialize session messages
    if "messages" not in st.session_state:
        st.session_state.messages = []

        # 🧠 Inject mock loop memory context
        st.session_state.messages.append({
            "role": "system",
            "content": "You are Ora, a structured executive assistant. You have access to the user's loop memory. Current open loops:
- loop-2025-05-14 (tagged #email, #false_positive)
- loop-2025-05-16 (tagged #strategy)

You should reflect on these when answering."
        })

    user_input = st.chat_input("Ask Ora anything...")

    if user_input:
        st.session_state.messages.append({"role": "user", "content": user_input})

        with st.spinner("Ora is thinking..."):
            try:
                response = openai.ChatCompletion.create(
                    model="gpt-4",
                    messages=st.session_state.messages,
                )
                assistant_message = response["choices"][0]["message"]["content"]
                st.session_state.messages.append({"role": "assistant", "content": assistant_message})
            except Exception as e:
                st.error(f"OpenAI error: {e}")
                return

    # Display chat history
    for message in st.session_state.messages:
        if message["role"] == "user":
            st.chat_message("user").write(message["content"])
        elif message["role"] == "assistant":
            st.chat_message("assistant").write(message["content"])
