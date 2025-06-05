from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
VAULT_PATH = PROJECT_ROOT / "vault"
LOOPS_DIR = VAULT_PATH / "Retrospectives" / "Loops"
ROADMAP_DIR = VAULT_PATH / "Roadmap"
INBOX_DIR = VAULT_PATH / "0001 HQ" / "Inbox"
CODE_PATH = PROJECT_ROOT
RETRO_PATH = PROJECT_ROOT / "Retrospectives"
ROADMAP_PATH = PROJECT_ROOT / "Roadmap"
REFERENCE_PATH = PROJECT_ROOT / "System/Reference"
SYSTEM_PATH = PROJECT_ROOT / "System"
LOG_PATH = PROJECT_ROOT / "System/Logs"
REFLECTIONS_DIR = VAULT_PATH / "Retrospectives"
INSIGHTS_DIR = REFLECTIONS_DIR / "Insights"

# Example usage:
# from system.path_config import RETRO_PATH
# for f in RETRO_PATH.glob("*.md"): ... 