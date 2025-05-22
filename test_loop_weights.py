import sqlite3
from datetime import date

db_path = "/Users/air/ea_assistant/loop_memory.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT id, status, created, feedback, priority FROM loops")
rows = cursor.fetchall()
conn.close()

for row in rows:
    loop_id, status, created, feedback, priority = row
    weight = 0
    if feedback == "useful":
        weight += 1
    elif feedback == "false_positive":
        weight -= 3
    age_days = (date.today() - date.fromisoformat(created)).days
    if status == "open" and age_days > 30:
        weight -= 1
    print(f"{loop_id} — weight: {weight} — feedback: {feedback} — age: {age_days} days — status: {status}")

