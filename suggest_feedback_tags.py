from pathlib import Path
import openai
import yaml
import os

loop_dir = Path("runtime/loops")
openai.api_key = os.getenv("OPENAI_API_KEY")
tag_suggestions = {}

for file in loop_dir.glob("*.md"):
    content = file.read_text()
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": "You are a reflection analyst. Based on the content, suggest tags like #useful, #false_positive, #duplicate, or #needs_review."
            },
            {
                "role": "user",
                "content": content[:3000]
            }
        ],
        temperature=0.2
    )
    suggested = response['choices'][0]['message']['content'].strip()
    tag_suggestions[file.name] = suggested
    print(f"📄 {file.name}: {suggested}")

with open("suggested_feedback_tags.yaml", "w") as f:
    yaml.dump(tag_suggestions, f)

print("\n✅ Suggestions saved to suggested_feedback_tags.yaml") 