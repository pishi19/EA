from pathlib import Path

# This script assumes it is run from the project root directory.
PROJECT_ROOT = Path(".") # Current directory, assumed to be project root
ORA_UI_PATH = PROJECT_ROOT / "src" / "interface" / "ora_ui.py"

def fix_imports_in_ora_ui():
    print(f"Attempting to fix import paths in: {ORA_UI_PATH}")
    if ORA_UI_PATH.exists():
        try:
            original_text = ORA_UI_PATH.read_text(encoding="utf-8")
            
            # Perform replacements
            # It's important that these replacements are specific enough not to cause unintended changes.
            # For example, ensure that "ui." is not part of a longer word or a comment accidentally.
            # Using simple string replace here as per user script.
            patched_text = original_text.replace("from ui.", "from src.ui.")
            patched_text = patched_text.replace("import ui.", "import src.ui.")
            # Consider if other patterns like "from .ui" or similar might exist if it was part of a package.
            # For now, sticking to the exact replacements requested.

            if patched_text != original_text:
                ORA_UI_PATH.write_text(patched_text, encoding="utf-8")
                print(f"✅ Imports updated in: {ORA_UI_PATH}")
            else:
                print(f"No changes needed for import paths in: {ORA_UI_PATH}")

        except FileNotFoundError: # Should be caught by .exists() but good for robustness
            print(f"❌ Error: {ORA_UI_PATH} not found during read/write phase.")
        except Exception as e:
            print(f"❌ An error occurred while processing {ORA_UI_PATH}: {e}")
    else:
        print(f"❌ File not found: {ORA_UI_PATH}. Cannot fix imports.")
        # The user script had `raise FileNotFoundError`, but for a utility, printing might be friendlier.
        # raise FileNotFoundError(f"{ORA_UI_PATH} not found at expected path.") 

if __name__ == "__main__":
    fix_imports_in_ora_ui() 