import streamlit as st
import openai # Make sure your OPENAI_API_KEY is set in your environment
import html # For escaping HTML content

MAX_DISPLAY_MESSAGES = 25 # Number of recent messages to display

def render_chat_view():
    st.title("💬 Ora Chat")

    # Initialize chat history in session state if it doesn't exist
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    # CSS for individual messages, as per the 'yep all working' state
    st.markdown(""" 
    <style>
    /* No .chat-window styles are active/defined in this version */
    
    .chat-message { 
        padding: 8px 12px; 
        border-radius: 18px; 
        margin-bottom: 8px; 
        max-width: 75%; 
        word-wrap: break-word;
        border: 1px solid #ddd; /* Light border to see message bounds */
        color: black !important; /* Ensure text is black */
    }
    .user-message { 
        background-color: #DCF8C6; /* Light green for user */
        margin-left: auto; /* Push to the right */
        margin-right: 10px; /* Small margin from edge */
        border-bottom-right-radius: 4px; 
    }
    .assistant-message { 
        background-color: #FFFFFF; /* White for assistant */
        margin-right: auto; /* Push to the left */
        margin-left: 10px; /* Small margin from edge */
        border: 1px solid #E0E0E0; 
        border-bottom-left-radius: 4px; 
    }
    </style>
    """, unsafe_allow_html=True)

    # Render messages directly, each with its own st.markdown call
    messages_to_render = st.session_state.chat_history[-MAX_DISPLAY_MESSAGES:]
    for msg_data in messages_to_render:
        role = msg_data["role"]
        content = msg_data["content"]
        escaped_content = html.escape(content)
        css_class = "user-message" if role == "user" else "assistant-message"
        message_html = f'''
            <div class="chat-message {css_class}">
                <div class="message-content">{escaped_content}</div>
            </div>
        '''
        st.markdown(message_html, unsafe_allow_html=True) # Render each message block directly

    with st.form("chat_form", clear_on_submit=True):
        user_prompt = st.text_input("Your message:", key="user_prompt_input", placeholder="Type your message...")
        submitted = st.form_submit_button("Send")

    if submitted and user_prompt:
        # Add user message ONCE
        st.session_state.chat_history.append({"role": "user", "content": user_prompt})
        
        try:
            with st.spinner("Ora is thinking..."):
                messages_for_api = [{"role": "system", "content": "You are Ora, a helpful AI assistant."}]
                # Send history that INCLUDES the current user message for context
                for msg in st.session_state.chat_history[-10:]:
                    messages_for_api.append(msg)
                
                client = openai.OpenAI()
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=messages_for_api
                )
                assistant_reply = response.choices[0].message.content.strip()

            st.session_state.chat_history.append({"role": "assistant", "content": assistant_reply})
        
        except Exception as e:
            st.error(f"An error occurred: {type(e).__name__}: {e}")
            # Optionally, remove the user message if API call failed to keep state clean
            if st.session_state.chat_history and st.session_state.chat_history[-1]["role"] == "user":
                st.session_state.chat_history.pop() 
        finally:
            # Re-introduce rerun to ensure a clean state for the next render and form
            st.rerun()

    # Debug expander removed for cleaner UI
    # with st.expander("DEBUG: Raw Chat History State"):
    #     st.json(st.session_state.get("chat_history", []))

# To make it directly runnable for testing (optional)
if __name__ == "__main__":
    # You might need to set an API key for direct testing if it's not in env
    # import os
    # os.environ["OPENAI_API_KEY"] = "YOUR_KEY_HERE" 
    render_chat_view()
