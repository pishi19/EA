import datetime
from pathlib import Path

from config import DAILY_NOTES_PATH, LOG_PATH, OPENAI_API_KEY
from openai import OpenAI
from openai.types.chat import ChatCompletion

client = OpenAI(api_key=OPENAI_API_KEY)


def generate_structured_content() -> str:
    today = datetime.date.today().strftime("%A, %B %d, %Y")
    prompt = f"""
Today is {today}.
Generate an assistant-style Obsidian daily summary including:

1. A section titled "Today's Three Priorities" - clear, strategic items
2. A section called "Reflective Focus" - a self-reflection or grounding question
3. An "Emotional Register" based on tone trends in recent work
4. A "Virtue to Embody" for today
5. A closing paragraph called "Alignment Note (Bahá'í Context)" with a quote or framing from Bahá'u'lláh's writings
Return this as a markdown note starting with "# Assistant Summary - {today}"
"""

    response: ChatCompletion = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "You are a spiritually-aligned executive assistant that writes reflective daily summaries for your user's Obsidian vault.",
            },
            {"role": "user", "content": prompt},
        ],
    )

    return response.choices[0].message.content


def write_daily_note(content: str) -> Path:
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    filename = f"{today_str} (assistant).md"
    path = Path(DAILY_NOTES_PATH) / filename
    Path(DAILY_NOTES_PATH).mkdir(parents=True, exist_ok=True)

    with open(path, "w") as file:
        file.write(content)

    return path


def log_action(note_path: Path) -> None:
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    with open(LOG_PATH, "a") as log:
        log.write(f"\n[{now}] 📝 Assistant daily note written: {note_path.name}\n")


def main() -> None:
    print("🔍 Generating structured assistant daily note...")
    content = generate_structured_content()
    note_path = write_daily_note(content)
    log_action(note_path)
    print(f"✅ Structured assistant note written to: {note_path}")
    print("Daily note generation complete - you can find it in your vault.")


if __name__ == "__main__":
    main()
