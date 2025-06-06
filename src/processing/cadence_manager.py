import datetime
import subprocess

from src.system.path_config import CADENCE_LOG_FILE


def log(message, log_file=CADENCE_LOG_FILE):
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    log_file.parent.mkdir(parents=True, exist_ok=True)
    with open(log_file, "a") as f:
        f.write(f"\n[{now}] {message}\n")


def run_module(script_name, log_file=CADENCE_LOG_FILE):
    try:
        subprocess.run(["python3", f"{script_name}"], check=True)
        log(f"✅ Ran {script_name} successfully.", log_file=log_file)
    except subprocess.CalledProcessError as e:
        log(f"❌ Error running {script_name}: {e}", log_file=log_file)


def main(today=None):
    if today is None:
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
