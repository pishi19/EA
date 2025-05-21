def render():
    import streamlit as st
    import os
    from openai import OpenAI

    from loop_memory_reader import get_open_loops, format_loops_for_gpt
    from vision_context_loader import load_vision_documents

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    st.title("💬 Chat with Ora")

    if "messages" not in st.session_state:
        st.session_state.messages = []

        # 🧠 Load system vision
        vision_context = load_vision_documents()

        # 🧠 Load loop memory
        open_loops = get_open_loops()
        loop_context = format_loops_for_gpt(open_loops)

        # 🔁 Inject both into assistant’s initial perspective
        orientation = f"""
{vision_context}

---

{loop_context}

Please reflect on this system vision and loop memory. Start the conversation by highlighting relevant active loops and their alignment to the assistant’s mission.
"""

        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are Ora, a structured executive assistant with memory and mission alignment."},
                    {"role": "user", "content": orientation}
                ],
            )
            assistant_message = response.choices[0].message.content
            st.session_state.messages.append({"role": "assistant", "content": assistant_message})
        except Exception as e:
            st.session_state.messages.append({"role": "assistant", "content": f"OpenAI error: {e}"})

    # Chat loop
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
