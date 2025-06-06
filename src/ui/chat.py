import streamlit as st

from src.system.data_loader import get_loop_summaries
from src.system.gpt_ora_chat import run_gpt_ora_chat


def render_chat():
    st.title("🧠 Ora Chat")

    summaries = get_loop_summaries()
    if not summaries:
        st.warning("No loops with summaries found.")
        return

    with st.expander("📄 View Summaries"):
        for s in summaries:
            st.markdown(f"**{s['id']}** — {s.get('summary', '')}")
            st.caption(f"Tags: {', '.join(s.get('tags', []))} | Score: {s.get('score', 0)}")
            st.divider()

    prompt = st.text_input("Ask Ora about your loops:")
    if prompt:
        with st.spinner("🧠 Thinking..."):
            try:
                response = run_gpt_ora_chat(prompt, summaries)
                st.success(response)
            except Exception as e:
                st.error(f"Error generating GPT response: {e}")
