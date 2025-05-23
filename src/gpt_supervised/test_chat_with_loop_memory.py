from load_loops_for_prompt import format_loops_for_prompt, get_recent_loops
from openai import OpenAI

from config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

loop_context = format_loops_for_prompt(get_recent_loops())

response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {
            "role": "system",
            "content": "You are Ora, a reflective executive assistant who incorporates historical loops into her thinking."
        },
        {
            "role": "system",
            "content": f"Context from recent memory loops:\n{loop_context}"
        },
        {
            "role": "user",
            "content": "How are we progressing toward better task automation?"
        }
    ],
    temperature=0.7,
    max_tokens=300,
)

print(response.choices[0].message.content.strip())
