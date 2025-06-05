import sys
from pathlib import Path

# Add project root to sys.path to allow for 'from src...' imports
# This assumes the script is in <project_root>/src/ui/pages/
project_root = Path(__file__).resolve().parents[3]
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

import streamlit as st
# Option 1: Import specific function
from src.ui.ora_chat_view import render_chat_view 
# Option 2: If using 'from src.ui.ora_chat_view import *', ensure render_chat_view is called.
# If you used 'import src.ui.ora_chat_view as ocv', you'd call ocv.render_chat_view()

# This renders the cleaned-up Ora assistant chat panel.
render_chat_view() # Call the function to render the UI
