from typing import List

from openai import OpenAI

client = OpenAI()

def run_gpt_ora_chat(prompt: str, loop_summaries: List[dict]) -> str:
    context_blocks = [
        f"- {s.get('id', 'N/A')}: {s.get('summary', '')}" for s in loop_summaries
    ]
    context_text = "\n".join(context_blocks)

    system_prompt = (
        "You are Ora, a context-aware assistant. "
        "The user is asking about their recent reflections. "
        "Use the summaries below to answer clearly and helpfully.\n\n"
        f"Reflections:\n{context_text}"
    )

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
    )

    return response.choices[0].message.content.strip()
