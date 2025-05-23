import datetime
import subprocess
from pathlib import Path

LOG_FILE = Path.home() / "ea_assistant" / "logs" / "system-log.md"

def log(message):
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as log_file:
        log_file.write(f"\n[{now}] {message}\n")

def run_module(script_name):
    try:
        subprocess.run(["python3", f"{script_name}"], check=True)
        log(f"✅ Ran {script_name} successfully.")
    except subprocess.CalledProcessError as e:
        log(f"❌ Error running {script_name}: {e}")

def main():
    today = datetime.date.today()
    weekday = today.weekday()  # Monday is 0, Sunday is 6
    day = today.day

    # Always run daily note generator
    run_module("run_daily_note.py")

    # Weekly: Run every Monday
    if weekday == 0:
        run_module("vault_alignment_checker.py")

    # Monthly: Run on the 1st
    if day == 1:
        run_module("monthly_review_generator.py")

    # Quarterly: Run on Jan 1, Apr 1, Jul 1, Oct 1
    if today.strftime("%m-%d") in ["01-01", "04-01", "07-01", "10-01"]:
        run_module("quarterly_reflection.py")

if __name__ == "__main__":
    main()
