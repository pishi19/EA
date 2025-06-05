import sys

try:
    from src.interface import ora_ui
    print("✅ SUCCESS: ora_ui imported successfully.")
except Exception as e:
    print("❌ ERROR: Failed to import ora_ui.")
    print(f"Reason: {e}")
    sys.exit(1) 