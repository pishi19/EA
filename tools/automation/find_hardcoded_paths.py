
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # assumes script is in tools/automation/
TARGET = "/Users/air/ea_assistant"
REPLACEMENT = "resolve(...)  # TODO: replace with path_config entry"

extensions = [".py", ".sh", ".md"]

def scan_and_flag():
    print(f"Scanning for hardcoded paths matching: {TARGET}\n")
    for file in ROOT.rglob("*"):
        if file.is_file() and file.suffix in extensions:
            try:
                content = file.read_text(encoding="utf-8")
                if TARGET in content:
                    print(f"🔍 Found in: {file.relative_to(ROOT)}")
                    for i, line in enumerate(content.splitlines(), 1):
                        if TARGET in line:
                            print(f"  {i:>4}: {line.strip()}")
                    print("—" * 60)
            except Exception as e:
                print(f"❌ Could not read {file}: {e}")

if __name__ == "__main__":
    scan_and_flag()
