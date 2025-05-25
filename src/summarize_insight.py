"""
summarize_insight.py

Uses OpenAI GPT (v1 SDK) to summarize insight content and generate tags + metadata.
"""

import openai

client = openai.OpenAI()


def summarize(content, tags):
    prompt = f"""You are an executive assistant. Summarize the following insight clearly, extract up to 5 relevant tags, and estimate the priority (low, medium, high). Insight:

{content}"""

    response = client.chat.completions.create(
        model="gpt-4o", messages=[{"role": "user", "content": prompt}], temperature=0.3
    )

    result = response.choices[0].message.content

    # Parse response for summary, tags, priority
    lines = result.strip().split("\n")
    summary = lines[0].strip()
    extracted_tags = tags if tags else []
    priority = "medium"

    for line in lines[1:]:
        if "Tags:" in line:
            extracted_tags = [tag.strip() for tag in line.split("Tags:")[1].split(",")]
        if "Priority:" in line:
            priority = line.split("Priority:")[1].strip().lower()

    metadata = {
        "tags": extracted_tags,
        "type": "loop",
        "status": "open",
        "priority": priority,
        "source": "manual",
    }

    return summary, metadata
