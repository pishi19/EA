import streamlit as st

st.set_page_config(page_title="Ora Chat Test")

st.title("Test Chat")

user_input = st.text_input("Say something")

if st.button("Send"):
    st.write(f"You said: {user_input}")
