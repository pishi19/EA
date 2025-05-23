def render():
    import os

    import streamlit as st
    from loop_memory_reader import format_loops_for_gpt, get_open_loops
    from openai import OpenAI

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    st.title("💬 Chat with Ora")

    if "messages" not in st.session_state:
        st.session_state.messages = []

        # 🧠 Inject real loop memory into GPT context
        open_loops = get_open_loops()
        memory_context = format_loops_for_gpt(open_loops)

        st.session_state.messages.append(
            {
                "role": "system",
                "content": "You are Ora, a structured executive assistant. You have access to the user's loop memory.",
            }
        )
        st.session_state.messages.append({"role": "assistant", "content": memory_context})

    user_input = st.chat_input("Ask Ora anything...")

    if user_input:
        st.session_state.messages.append({"role": "user", "content": user_input})

        with st.spinner("Ora is thinking..."):
            try:
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=st.session_state.messages,
                )
                assistant_message = response.choices[0].message.content
                st.session_state.messages.append(
                    {"role": "assistant", "content": assistant_message}
                )
            except Exception as e:
                st.error(f"OpenAI error: {e}")
                return

    for message in st.session_state.messages:
        if message["role"] == "user":
            st.chat_message("user").write(message["content"])
        elif message["role"] == "assistant":
            st.chat_message("assistant").write(message["content"])
