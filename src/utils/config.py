import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(env_path)

# === Ora Configuration ===

# OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError(
        "OPENAI_API_KEY not found in environment. "
        "Please create a .env file in the project root and add your API key: "
        "OPENAI_API_KEY=your_key_here"
    )

# Paths
BASE_DIR = Path(__file__).parent.parent.parent
VAULT_PATH = Path(os.getenv("VAULT_PATH", str(BASE_DIR / "vault")))
LOG_PATH = Path(os.getenv("LOG_PATH", str(BASE_DIR / "logs")))
DAILY_NOTES_PATH = Path(os.getenv("DAILY_NOTES_PATH", str(VAULT_PATH / "daily_notes")))

# Ensure required directories exist
for path in [VAULT_PATH, LOG_PATH, DAILY_NOTES_PATH]:
    path.mkdir(parents=True, exist_ok=True)

# Task Configuration
TASK_CLASSIFICATION_THRESHOLD = float(os.getenv("TASK_CLASSIFICATION_THRESHOLD", "0.7"))
IGNORED_SENDERS = os.getenv("IGNORED_SENDERS", "").split(",")

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Database Configuration
DB_PATH = Path(os.getenv("DB_PATH", str(BASE_DIR / "data" / "tasks.db")))
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

# Vector Store Configuration
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))

# Monitoring Configuration
MONITOR_INTERVAL = int(os.getenv("MONITOR_INTERVAL", "60"))  # seconds
GROWTH_THRESHOLD = float(os.getenv("GROWTH_THRESHOLD", "50.0"))  # percentage
ERROR_THRESHOLD = int(os.getenv("ERROR_THRESHOLD", "10"))  # count
WARNING_THRESHOLD = int(os.getenv("WARNING_THRESHOLD", "20"))  # count
MAX_LOG_SIZE = int(os.getenv("MAX_LOG_SIZE", "10485760"))  # 10MB in bytes
