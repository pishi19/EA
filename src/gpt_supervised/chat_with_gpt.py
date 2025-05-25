import sys
from typing import Optional

import openai

# Load config
try:
    from config import OPENAI_API_KEY
except ImportError:
    print("❌ Could not find config.py with OPENAI_API_KEY.")
    sys.exit(1)

# Load loop memory
try:
    from load_loops_for_prompt import format_loops_for_prompt, get_recent_loops

    loop_context = format_loops_for_prompt(get_recent_loops())
except Exception as e:
    loop_context = f"[Loop loading failed: {e}]"

# Initialize OpenAI client
client = openai.OpenAI(api_key=OPENAI_API_KEY)

def chat_completion(messages, model="gpt-4"):
    """Send a chat completion request to OpenAI."""
    return client.chat.completions.create(model=model, messages=messages)

class GPTClient:
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)

    def chat_completion(self, messages: list[dict[str, str]], model: str = "gpt-4") -> str:
        """Send a chat completion request to OpenAI."""
        response = self.client.chat.completions.create(model=model, messages=messages)
        return response.choices[0].message.content

def chat_with_gpt(prompt: str, mock_openai_response: Optional[str] = None) -> str:
    """Chat with GPT using the provided prompt."""
    if mock_openai_response:
        return mock_openai_response

    messages = [
        {
            "role": "system",
            "content": "You are Ora, a reflective executive assistant who incorporates historical loops into her thinking.",
        },
        {
            "role": "system",
            "content": f"Context from recent memory loops:\n{loop_context}",
        },
        {"role": "user", "content": prompt},
    ]
    response = client.chat.completions.create(model="gpt-4", messages=messages)
    return response.choices[0].message.content
