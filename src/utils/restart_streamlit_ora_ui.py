import subprocess
import signal # signal module was imported in user script but not used; can be removed.
import os # For checking if the target script exists
from pathlib import Path

# Script assumes it's run from the project root.
# Adapt path for the target Streamlit app to be relative to project root.
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent # Assuming this script is in src/utils/
TARGET_STREAMLIT_APP = PROJECT_ROOT / "src" / "interface" / "ora_ui.py"

def restart_ora_ui():
    print("Attempting to kill any existing Streamlit processes...")
    try:
        # Using a more targeted kill if possible, but -f is broad.
        # On macOS, pkill might require sudo or might not be as effective without it for all processes.
        # For processes started by the current user, it should work.
        kill_process = subprocess.run(["pkill", "-f", "streamlit"], capture_output=True, text=True)
        if kill_process.returncode == 0:
            print("Successfully sent kill signal to processes matching 'streamlit'.")
        elif kill_process.returncode == 1: # pkill returns 1 if no processes matched
            print("No active Streamlit processes found to kill.")
        else:
            print(f"Warning: pkill command exited with code {kill_process.returncode}. Error: {kill_process.stderr}")
    except FileNotFoundError:
        print("Error: 'pkill' command not found. Cannot stop existing Streamlit processes this way.")
    except Exception as e:
        print(f"Error during pkill: {e}")

    print(f"\nRelaunching Ora UI from: {TARGET_STREAMLIT_APP}")
    if not TARGET_STREAMLIT_APP.exists():
        print(f"❌ Error: Target Streamlit app not found: {TARGET_STREAMLIT_APP}")
        print("Please ensure the path is correct and the file exists.")
        return

    try:
        # Using absolute path for streamlit command for clarity
        streamlit_executable = "streamlit" # Assumes streamlit is in PATH
        # Check if running in a venv which might have its own streamlit
        venv_streamlit = Path(os.environ.get("VIRTUAL_ENV", "")) / "bin" / "streamlit"
        if venv_streamlit.exists():
            streamlit_executable = str(venv_streamlit)
            print(f"Using streamlit from venv: {streamlit_executable}")

        command = [
            streamlit_executable, "run", str(TARGET_STREAMLIT_APP),
            "--server.port", "8501",
            "--server.headless", "true", # Useful for background processes
            "--server.enableCORS", "false" # Note: often it's true for CORS
        ]
        print(f"Executing: {' '.join(command)}")
        
        # start_new_session=True on POSIX creates a new process group, detaching it.
        # On Windows, it uses DETACHED_PROCESS and CREATE_NEW_PROCESS_GROUP.
        # Use Popen for non-blocking execution.
        process = subprocess.Popen(command, start_new_session=True)
        print(f"✅ Ora UI (ora_ui.py) launched with PID: {process.pid} on port 8501.")
        print("   It should be running in the background.")
        print("   Check http://localhost:8501 or the appropriate network URL.")

    except FileNotFoundError:
        print(f"Error: 'streamlit' command not found. Is Streamlit installed and in your PATH?")
    except Exception as e:
        print(f"❌ Error relaunching Ora UI: {e}")

if __name__ == "__main__":
    restart_ora_ui() 