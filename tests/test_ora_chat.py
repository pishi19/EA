import pytest
from openai import OpenAI

def test_ora_chat_response():
    client = OpenAI()
    stream = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "user", "content": "What is Ora?"}
        ],
        temperature=0.7,
        max_tokens=500,
        stream=True,
    )

    output = ""
    for chunk in stream:
        delta = chunk.choices[0].delta
        if delta and getattr(delta, 'content', None):
            output += delta.content

    assert "Ora" in output
    assert len(output) > 10 