import sys

ui_modules = [
    # "src.interface.ora_ui",  # Removed: file does not exist
    "src.interface.streamlit_app",
    "src.interface.streamlit_app_fixed",
    "src.interface.streamlit_app_with_chat",
    "src.interface.streamlit_app_safe",
    "src.cursor_dashboard"
]

failures = []

for module in ui_modules:
    try:
        __import__(module)
        print(f"✅ {module} imported successfully.")
    except Exception as e:
        print(f"❌ Failed to import {module}: {e}")
        failures.append((module, str(e)))

if failures:
    print(f"\n❌ {len(failures)} module(s) failed to import.")
    sys.exit(1)
else:
    print("\n✅ All UI modules imported successfully.") 