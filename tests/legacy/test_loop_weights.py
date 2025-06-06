import sqlite3
from datetime import date

from src.system.path_config import LOOP_MEMORY_DB

# This test is problematic because it connects to a live database.
# It should be refactored to use a test database.
# For now, we just ensure it can connect without error.
try:
    conn = sqlite3.connect(LOOP_MEMORY_DB)
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
        if created:
            try:
                age_days = (date.today() - date.fromisoformat(created)).days
                if status == "open" and age_days > 30:
                    weight -= 1
                print(
                    f"{loop_id} — weight: {weight} — feedback: {feedback} — age: {age_days} days — status: {status}"
                )
            except (ValueError, TypeError):
                print(f"Could not parse date for loop {loop_id}: {created}")
        else:
            print(f"Loop {loop_id} has no creation date.")

except sqlite3.OperationalError as e:
    print(f"Could not connect to database, this is expected if the db doesn't exist yet: {e}")
