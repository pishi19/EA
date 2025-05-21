def render():
    import streamlit as st
    import os
    from openai import OpenAI
    from loop_memory_reader import get_open_loops, format_loops_for_gpt

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    st.title("💬 Chat with Ora")

    if "messages" not in st.session_state:
        st.session_state.messages = []

        # 🧠 Inject real loop memory
        open_loops = get_open_loops()
        memory_context = format_loops_for_gpt(open_loops)

        # Full GPT init message
        intro = f"""You are Ora, a structured executive assistant with access to loop memory, system logs, and workflows.

{memory_context}

Please summarize this memory to the user and suggest any loops that may be ready to close.
"""

        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are Ora, a structured assistant with loop memory."},
                    {"role": "user", "content": intro}
                ],
            )
            assistant_message = response.choices[0].message.content
            st.session_state.messages.append({"role": "assistant", "content": assistant_message})
        except Exception as e:
            st.session_state.messages.append({"role": "assistant", "content": f"OpenAI error: {e}"})

    # User chat input
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
                st.session_state.messages.append({"role": "assistant", "content": assistant_message})
            except Exception as e:
                st.error(f"OpenAI error: {e}")
                return

    for message in st.session_state.messages:
        if message["role"] == "user":
            st.chat_message("user").write(message["content"])
        elif message["role"] == "assistant":
            st.chat_message("assistant").write(message["content"])
