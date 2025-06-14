import sys
from pathlib import Path

import openai


def extract_body_without_yaml(text):
    if text.startswith("---"):
        return text.split("---", 2)[2].strip()
    return text.strip()


def classify_loop_with_gpt(body):
    prompt = f"""You are a loop classification assistant. Read the content of this loop and generate the following structured YAML fields:

- summary: 1–2 sentence summary of the loop’s main insight or challenge.
- type: Choose one of ['reflection', 'strategy', 'feedback', 'signal', 'insight'].
- topic: A short topic identifier.
- tags: List of relevant tags like #loop, #gpt, #email, etc.
- verify_when: A date in YYYY-MM-DD format or null.

Loop content:
---
{body}
---

Respond with only a valid YAML block containing these fields.
"""
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 classify_loop_gpt.py <loop_filename>")
        sys.exit(1)

    file_path = Path("/Users/air/AIR01/Retrospectives") / sys.argv[1]
    text = file_path.read_text()

    existing_yaml, _, body = text.partition("---\n")[2].partition("---\n")
    body = body.strip()

    print("🧠 Running GPT classification...")
    yaml_output = classify_loop_with_gpt(body)

    print("\n--- GPT Output ---\n")
    print(yaml_output)

    decision = input("\nDo you want to overwrite the frontmatter with this output? (y/n): ")
    if decision.lower() != "y":
        print("Aborted.")
        return

    full_output = f"---\n{yaml_output}\n---\n\n{body}"
    file_path.write_text(full_output)
    print(f"✅ Updated {file_path.name} with new frontmatter.")


if __name__ == "__main__":
    main()
