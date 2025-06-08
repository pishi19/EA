import datetime
import os
import pickle
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from openai import OpenAI

from src.system.path_config import CREDENTIALS, TOKEN_PATH
from src.utils.config import OPENAI_API_KEY, DAILY_NOTES_PATH, LOG_PATH

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

# Google Calendar API scopes
SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
]


def get_calendar_events():
    creds = None

    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    else:
        flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS, SCOPES)
        creds = flow.run_local_server(port=0)
        with open(TOKEN_PATH, "w") as token:
            token.write(creds.to_json())

    service = build("calendar", "v3", credentials=creds)

    now = datetime.datetime.utcnow().isoformat() + "Z"
    end = (datetime.datetime.utcnow() + datetime.timedelta(days=1)).isoformat() + "Z"

    events_result = (
        service.events()
        .list(
            calendarId="primary",
            timeMin=now,
            timeMax=end,
            maxResults=10,
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )

    events = events_result.get("items", [])
    return events


def format_events(events):
    if not events:
        return "No meetings scheduled today."
    output = []
    for event in events:
        start = event["start"].get("dateTime", event["start"].get("date"))
        summary = event.get("summary", "(No title)")
        output.append(f"- {start}: {summary}")
    return "\n".join(output)


def generate_daily_note(events_text):
    today = datetime.date.today().strftime("%Y-%m-%d")
    prompt = f"""Today is {today}. Based on these calendar events, generate a Daily Note for Obsidian with the following sections:

## 📅 Schedule
{events_text}

## ✅ Tasks
- [ ] Example task

## 🔍 Focus
- Your intention or mindset for today.

## 🧠 Notes
- Observations, decisions, or reflections.

Use good formatting for Markdown. Keep it useful and to the point.
"""

    response = client.chat.completions.create(
        model="gpt-4o", messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content


def write_daily_note(content):
    today = datetime.date.today().strftime("%Y-%m-%d")
    filename = os.path.join(DAILY_NOTES_PATH, f"{today}.md")

    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, "w") as file:
        file.write(content)

    return filename


def write_log(note_path):
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    with open(LOG_PATH, "a") as log:
        log.write(f"- {now} - Created daily note at: {note_path}\n")


def main():
    events = get_calendar_events()
    events_text = format_events(events)
    note = generate_daily_note(events_text)
    note_path = write_daily_note(note)
    write_log(note_path)
    print(f"✅ Daily note created: {note_path}")


if __name__ == "__main__":
    main()
