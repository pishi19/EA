import os
from datetime import datetime
from openai import OpenAI

def run_gpt_ora_chat(query: str, loop_summaries: list) -> str:
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return "[ERROR: OPENAI_API_KEY not set]"
    client = OpenAI(api_key=api_key)
    # Build prompt
    prompt = "You are Ora, an executive memory assistant. The user's loop archive contains the following summaries:\n\n"
    for loop in loop_summaries:
        prompt += f"- File: {loop.get('path')}\n  Program: {loop.get('program')} | Project: {loop.get('project')} | Priority: {loop.get('priority')} | Ambiguity: {loop.get('ambiguity')}\n  Summary: {loop.get('summary', '_No summary available_')}\n  Feedback: {loop.get('summary_feedback', {})}\n  Last Updated: {loop.get('last_updated')}\n\n"
    prompt += f"\nThe user is asking: '{query}'\nRespond with insight and, if possible, list affected loop files."
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful executive memory assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.4
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"[GPT-4 ERROR: {e}]"

def run_gpt_ora_chat_streaming(query: str, loop_summaries: list):
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        yield "[ERROR: OPENAI_API_KEY not set]"
        return
    client = OpenAI(api_key=api_key)
    prompt = "You are Ora, an executive memory assistant. The user's loop archive contains the following summaries:\n\n"
    for loop in loop_summaries:
        prompt += f"- File: {loop.get('path')}\n  Program: {loop.get('program')} | Project: {loop.get('project')} | Priority: {loop.get('priority')} | Ambiguity: {loop.get('ambiguity')}\n  Summary: {loop.get('summary', '_No summary available_')}\n  Feedback: {loop.get('summary_feedback', {})}\n  Last Updated: {loop.get('last_updated')}\n\n"
    prompt += f"\nThe user is asking: '{query}'\nRespond with insight and, if possible, list affected loop files."
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful executive memory assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.4,
            stream=True
        )
        for chunk in response:
            delta = getattr(chunk.choices[0].delta, 'content', None)
            if delta:
                yield delta
    except Exception as e:
        yield f"[GPT-4 ERROR: {e}]" 