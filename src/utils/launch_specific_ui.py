import os
import subprocess
import signal
from pathlib import Path

# This script assumes it is run from the project root directory.
PROJECT_ROOT = Path(os.getcwd()) # Get current working directory, assumed to be project root
TARGET_STREAMLIT_APP = PROJECT_ROOT / "src" / "interface" / "ora_ui.py"
TARGET_PORT = "8501"

def launch_ora_interface():
    print(f"Attempting to ensure port {TARGET_PORT} is free...")
    try:
        # Find PID using the port
        lsof_process = subprocess.run(["lsof", "-t", f"-i:{TARGET_PORT}"], capture_output=True, text=True, check=False)
        pid_to_kill = lsof_process.stdout.strip()
        
        if pid_to_kill:
            print(f"Process found on port {TARGET_PORT} with PID(s): {pid_to_kill}. Attempting to kill...")
            # lsof might return multiple PIDs, one per line
            for pid_str in pid_to_kill.splitlines():
                if pid_str.isdigit():
                    try:
                        os.kill(int(pid_str), signal.SIGKILL) # Using SIGKILL for forceful termination
                        print(f"  Killed process {pid_str}.")
                    except OSError as e:
                        print(f"  Could not kill process {pid_str}: {e}")
        else:
            print(f"No process found running on port {TARGET_PORT}.")
            
    except FileNotFoundError:
        print("Warning: 'lsof' command not found. Cannot check/kill process by port. Manual check might be needed.")
    except Exception as e:
        print(f"Error while trying to free port {TARGET_PORT}: {e}")

    # Set OPENAI_API_KEY - IMPORTANT: Replace with your actual key or use a .env file
    # For security, it's better to load from environment (e.g., .env file or shell export)
    # than to hardcode here, even as a placeholder.
    openai_api_key_placeholder = "YOUR_OPENAI_API_KEY_HERE" # Standard placeholder
    if "OPENAI_API_KEY" not in os.environ:
        print(f"OPENAI_API_KEY not found in environment. Setting to placeholder: '{openai_api_key_placeholder[:10]}...'")
        print("WARNING: Ensure a valid OpenAI API key is set in your environment for full functionality.")
        os.environ["OPENAI_API_KEY"] = openai_api_key_placeholder # Using placeholder if not set
    else:
        print("OPENAI_API_KEY found in environment.")

    # Set PYTHONPATH to current project root
    # This script should be run from the project root for os.getcwd() to be correct.
    os.environ["PYTHONPATH"] = str(PROJECT_ROOT)
    print(f"PYTHONPATH set to: {os.environ['PYTHONPATH']}")

    print(f"\nLaunching Streamlit app: {TARGET_STREAMLIT_APP} on port {TARGET_PORT}")
    if not TARGET_STREAMLIT_APP.exists():
        print(f"❌ Error: Target Streamlit app not found: {TARGET_STREAMLIT_APP}")
        print("Please ensure the path is correct and the file exists.")
        return

    try:
        streamlit_executable = "streamlit"
        venv_streamlit = Path(os.environ.get("VIRTUAL_ENV", "")) / "bin" / "streamlit"
        if venv_streamlit.exists():
            streamlit_executable = str(venv_streamlit)
            print(f"Using streamlit from venv: {streamlit_executable}")

        command = [
            streamlit_executable, "run", str(TARGET_STREAMLIT_APP),
            "--server.port", TARGET_PORT
            # Add other server options if needed, e.g.:
            # "--server.headless", "true",
            # "--server.enableCORS", "false"
        ]
        print(f"Executing: {' '.join(command)}")
        
        # Popen with start_new_session=True to detach.
        process = subprocess.Popen(command, start_new_session=True)
        print(f"✅ Streamlit app '{TARGET_STREAMLIT_APP.name}' launched with PID: {process.pid} on port {TARGET_PORT}.")
        print("   It should be running in the background.")
        print(f"   Check http://localhost:{TARGET_PORT} or the appropriate network URL.")

    except FileNotFoundError:
        print(f"Error: 'streamlit' command not found. Is Streamlit installed and in your PATH?")
    except Exception as e:
        print(f"❌ Error launching Streamlit app: {e}")

if __name__ == "__main__":
    launch_ora_interface() 