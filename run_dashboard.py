#!/usr/bin/env python3
import os
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

# Run the dashboard
from src.cursor_dashboard import CursorDashboard
dashboard = CursorDashboard()
dashboard.render() 