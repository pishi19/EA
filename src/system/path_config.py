from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Runtime directory
RUNTIME_DIR = PROJECT_ROOT / "runtime"
DB_DIR = RUNTIME_DIR / "db"
LOG_DIR = RUNTIME_DIR / "logs"
VECTOR_INDEX_DIR = RUNTIME_DIR / "vector_index"
CREDENTIALS_DIR = RUNTIME_DIR / "credentials"

# Ensure directories exist
DB_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)
VECTOR_INDEX_DIR.mkdir(parents=True, exist_ok=True)
CREDENTIALS_DIR.mkdir(parents=True, exist_ok=True)

# Preconfigured paths
CREDENTIALS = CREDENTIALS_DIR / "credentials_gmail.json"
TOKEN_PATH = CREDENTIALS_DIR / "token_gmail.pkl"
DB_LOOP_FEEDBACK = DB_DIR / "loop_feedback.db"
MCP_MEMORY_DB = DB_DIR / "mcp_memory.db"
LOG_SYSTEM = LOG_DIR / "system-log.md"
LOOP_MEMORY_DB = DB_DIR / "loop_memory.db"
MCP_MEMORY_JSON = DB_DIR / "loop_memory.json"
MCP_LOG = LOG_DIR / "sync_loops.out"
VAULT_SNAPSHOT = RUNTIME_DIR / "vault_structure_snapshot.json"
INDEX_PATH = VECTOR_INDEX_DIR / "faiss_index.idx"
META_PATH = VECTOR_INDEX_DIR / "chunk_metadata.pkl"
EMBED_TRACK_FILE = RUNTIME_DIR / ".last_embed_sync"
EXTRACT_LOG_PATH = LOG_DIR / "extract_loops.log"
CADENCE_LOG_FILE = LOG_DIR / "cadence-manager.log"
TAG_CLEANUP_LOG_FILE = LOG_DIR / "tag-cleanup.log"
EMAIL_LOG_PATH = LOG_DIR / "EmailLog.md"

# Old vault paths (to be deprecated)
VAULT_PATH = PROJECT_ROOT / "vault"
LOOPS_DIR = VAULT_PATH / "Retrospectives" / "Loops"
ROADMAP_DIR = VAULT_PATH / "Roadmap"
INBOX_DIR = VAULT_PATH / "0001 HQ" / "Inbox"
CODE_PATH = PROJECT_ROOT
RETRO_PATH = PROJECT_ROOT / "Retrospectives"
ROADMAP_PATH = PROJECT_ROOT / "Roadmap"
REFERENCE_PATH = PROJECT_ROOT / "System/Reference"
SYSTEM_PATH = PROJECT_ROOT / "System"
VAULT_INDEX_FILE = SYSTEM_PATH / "vault_index.json"
LOG_PATH = PROJECT_ROOT / "System/Logs"
REFLECTIONS_DIR = VAULT_PATH / "Retrospectives"
INSIGHTS_DIR = REFLECTIONS_DIR / "Insights"

# Example usage:
# from system.path_config import RETRO_PATH
# for f in RETRO_PATH.glob("*.md"): ...
