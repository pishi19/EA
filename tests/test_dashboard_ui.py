import subprocess
import sys
import time
import os
import pytest

@pytest.mark.timeout(30)
def test_streamlit_dashboard_tabs():
    """
    Launch the Streamlit app and check for main tab names in the output.
    """
    # Path to the Streamlit app
    app_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../src/cursor_dashboard.py'))
    # Launch Streamlit in a subprocess
    proc = subprocess.Popen([
        sys.executable, '-m', 'streamlit', 'run', app_path
    ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    try:
        # Wait for the server to boot
        time.sleep(7)
        # Check if process is still running
        assert proc.poll() is None, "Streamlit app crashed on launch!"
        # Read some output
        output = ""
        for _ in range(20):
            line = proc.stdout.readline()
            if not line:
                break
            output += line
        # Check for tab names
        for tab in ["📥 Inbox", "📊 Dashboard", "🧠 Ora Chat", "📍 Roadmap"]:
            assert tab in output or tab in output.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore'), f"Tab '{tab}' not found in output!"
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill() 