def render():
    import os

    import streamlit as st
    from loop_memory_reader import format_loops_for_gpt, get_open_loops
    from openai import OpenAI
    from vector_memory import query_vector_memory

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    st.title("💬 Chat with Ora")

    if "messages" not in st.session_state:
        st.session_state.messages = []

        # Load loop memory
        loop_context = format_loops_for_gpt(get_open_loops())

        st.session_state.memory_loaded = {"loop_context": loop_context, "vector_context": ""}

    user_input = st.chat_input("Ask Ora anything...")

    if user_input:
        st.session_state.messages.append({"role": "user", "content": user_input})

        # 🧠 Vector memory injection based on user message
        try:
            vector_chunks = query_vector_memory(user_input, top_k=3)
            vector_texts = [f"From {src}:\n{text}" for src, text in vector_chunks]
            vector_context = "\n---\n".join(vector_texts)
        except Exception as e:
            vector_context = f"[Vector memory error: {e}]"

        st.session_state.memory_loaded["vector_context"] = vector_context

        # Inject memory + vector as assistant context
        initial_context = f"""
Loop Memory:
{st.session_state.memory_loaded["loop_context"]}

---

Relevant Past Knowledge:
{st.session_state.memory_loaded["vector_context"]}
"""

        with st.spinner("Ora is thinking..."):
            try:
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are Ora, an executive assistant with loop memory and semantic recall.",
                        },
                        {"role": "user", "content": user_input},
                        {"role": "assistant", "content": initial_context},
                    ],
                )
                assistant_message = response.choices[0].message.content
                st.session_state.messages.append(
                    {"role": "assistant", "content": assistant_message}
                )
            except Exception as e:
                st.session_state.messages.append(
                    {"role": "assistant", "content": f"OpenAI error: {e}"}
                )

    for message in st.session_state.messages:
        if message["role"] == "user":
            st.chat_message("user").write(message["content"])
        elif message["role"] == "assistant":
            st.chat_message("assistant").write(message["content"])
