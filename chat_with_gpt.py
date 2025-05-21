import openai
import os
import sys

# Load config
try:
    from config import OPENAI_API_KEY
except ImportError:
    print("❌ Could not find config.py with OPENAI_API_KEY.")
    sys.exit(1)

# Load loop memory
try:
    from load_loops_for_prompt import get_recent_loops, format_loops_for_prompt
    loop_context = format_loops_for_prompt(get_recent_loops())
except Exception as e:
    loop_context = f"[Loop loading failed: {e}]"

client = openai.OpenAI(api_key=OPENAI_API_KEY)

def chat_with_gpt(prompt, system_message="You are Ora, a reflective executive assistant who incorporates historical loops into her thinking."):
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": system_message
                },
                {
                    "role": "system",
                    "content": f"Context from recent memory loops:\n{loop_context}"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=500,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"⚠️ GPT Error: {e}"
