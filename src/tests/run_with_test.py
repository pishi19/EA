import importlib
import sys
import traceback
from datetime import datetime
from pathlib import Path

LOG_FILE = Path.home() / "ea_assistant" / "logs" / "system-log.md"

def log_result(module_name, status, message=""):
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    status_icon = "✅" if status == "SUCCESS" else "❌"
    log_line = f"\n### {status_icon} {module_name} – {status} at {now}\n{message}\n"
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as log:
        log.write(log_line)

def run_and_test(module_name):
    print(f"🔍 Running module: {module_name}")
    try:
        mod = importlib.import_module(module_name)
        if hasattr(mod, "main"):
            mod.main()
        else:
            raise AttributeError("No main() function found.")
        log_result(module_name, "SUCCESS")
        print(f"✅ {module_name} ran successfully.")
    except Exception:
        error_msg = traceback.format_exc()
        log_result(module_name, "ERROR", error_msg)
        print(f"❌ Error running {module_name}:\n{error_msg}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 run_with_test.py module_name (without .py)")
    else:
        run_and_test(sys.argv[1])
