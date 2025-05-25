import os
import re
from datetime import datetime
from pathlib import Path

from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

STARRED_LOG_PATH = "/Users/air/AIR01/System/Logs/email-starred-log.md"
RETRO_PATH = Path("/Users/air/AIR01/Retrospectives")


def extract_latest_starred_entry():
    with open(STARRED_LOG_PATH) as f:
        content = f.read()

    entries = re.split(r"^### \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", content, flags=re.MULTILINE)
    if not entries or len(entries) < 2:
        raise ValueError("No starred email entries found.")

    # Get last full entry
    last = entries[-1].strip()
    return last


def suggest_loop_text(email_entry: str) -> str:
    prompt = f"""
You are Ora, a structured assistant. Based on the following starred email log, propose a YAML-frontmatter loop file for /Retrospectives/.

Only output the markdown content.

EMAIL:
{email_entry}

Respond with:
---
id: loop-<today>
summary: ...
tags: [#email, #starred, ...]
topic: ...
status: open
source: gmail:<threadId or subject>
created_at: <YYYY-MM-DDTHH:MM>
---

<loop content>
"""

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content.strip()


def write_loop_file(markdown: str):
    today = datetime.now().strftime("%Y-%m-%d")
    filename = f"loop-{today}-email.md"
    path = RETRO_PATH / filename
    with open(path, "w") as f:
        f.write(markdown)
    print(f"✅ Loop draft written to {path}")


def main():
    try:
        email_entry = extract_latest_starred_entry()
        loop_text = suggest_loop_text(email_entry)
        print("\n--- GPT Loop Draft ---\n")
        print(loop_text)
        confirm = input("\nWrite this to /Retrospectives/? (y/n): ").strip().lower()
        if confirm == "y":
            write_loop_file(loop_text)
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main()
