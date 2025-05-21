import openai
from pathlib import Path
import re
from datetime import datetime

# Initialize OpenAI client
client = openai.OpenAI()

# Define file paths
signal_tasks_path = Path("/Users/air/AIR01/0001 HQ/Signal_Tasks.md")
retrospective_path = Path("/Users/air/AIR01/Retrospectives")

def extract_structured_email_tasks(markdown_text, limit=10):
    email_pattern = r"- \[ \] Follow up on: (.*?) from .*? — \[View source\]\((.*?)\) threadId:(\S+)"
    matches = re.findall(email_pattern, markdown_text)
    return matches[:limit]

def ask_gpt_to_classify(tasks):
    content_block = "\n".join([f"- {subject} (threadId: {threadId})" for subject, link, threadId in tasks])
    prompt = f"""You are a reflective assistant. Review the following set of email follow-up tasks and identify any systemic insights or patterns that should be captured as a strategic loop. If there is nothing worth looping, reply with 'skip'.

Tasks:
{content_block}

If there is an insight, return a markdown file with YAML frontmatter and a reflective body.
"""

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    return response.choices[0].message.content.strip()

def main():
    today = datetime.now().strftime("%Y-%m-%d")
    loop_id = f"loop-{today}-email-classified"

    try:
        content = signal_tasks_path.read_text()
    except FileNotFoundError:
        print(f"❌ File not found: {signal_tasks_path}")
        return

    tasks = extract_structured_email_tasks(content)
    if not tasks:
        print("⚠️ No email tasks found for classification.")
        return

    print(f"📨 Extracted {len(tasks)} tasks for GPT analysis...")

    gpt_output = ask_gpt_to_classify(tasks)
    if gpt_output.strip().lower() == "skip":
        print("🧠 GPT determined no loop-worthy insight was found.")
        return

    output_path = retrospective_path / f"{loop_id}.md"
    output_path.write_text(gpt_output)
    print(f"✅ Loop written to {output_path}")

if __name__ == "__main__":
    main()
