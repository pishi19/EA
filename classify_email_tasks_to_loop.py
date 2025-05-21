import openai
from pathlib import Path
from datetime import datetime

# Adjust this to your actual Signal_Tasks.md path
signal_tasks_path = Path("/Users/air/AIR01/0001 HQ/Signal_Tasks.md")
retrospective_path = Path("/Users/air/AIR01/Retrospectives")

# Initialize OpenAI client
client = openai.OpenAI()

def extract_email_tasks(file_path, limit=10):
    if not file_path.exists():
        raise FileNotFoundError(f"Signal_Tasks.md not found at: {file_path}")
    lines = file_path.read_text().splitlines()
    email_tasks = [line for line in lines if line.strip().startswith("- [") and "#email" in line]
    return email_tasks[:limit]

def generate_gpt_loop(tasks):
    task_block = "\n".join(tasks)
    prompt = f"""You are a systems assistant. Review the following 10 email-derived tasks and determine what reflective insight or strategic pattern they reveal. Summarize it as a retrospective loop with YAML frontmatter and a short narrative body. If there's no insight, return 'skip'.

Email Tasks:
{task_block}

Respond with a loop markdown file: YAML frontmatter followed by the body content.
"""
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()

def write_loop_file(content, loop_id):
    filename = f"{loop_id}.md"
    path = retrospective_path / filename
    path.write_text(content)
    print(f"✅ Loop written to: {path}")

def main():
    today = datetime.now().strftime("%Y-%m-%d")
    loop_id = f"loop-{today}-email-scan"

    try:
        tasks = extract_email_tasks(signal_tasks_path)
    except FileNotFoundError as e:
        print(str(e))
        return

    print(f"📨 Extracted {len(tasks)} email tasks:")
    for task in tasks:
        print(" -", task)

    print("\n🧠 Classifying with GPT...")
    loop_output = generate_gpt_loop(tasks)

    if loop_output.strip().lower() == "skip":
        print("⚠️ No meaningful insight found. No loop created.")
        return

    write_loop_file(loop_output, loop_id)

if __name__ == "__main__":
    main()
