
from pathlib import Path

# Absolute root of the EA system
VAULT_ROOT = Path("/Users/air/AIR01/EA/ea_cursor_system_coupled")

def resolve(*parts):
    return VAULT_ROOT.joinpath(*parts)

# Preconfigured paths
CREDENTIALS = resolve("credentials", "credentials_gmail.json")
TOKEN_PATH = resolve("credentials", "token_gmail.pkl")
DB_LOOP_FEEDBACK = resolve("db", "loop_feedback.db")
MCP_MEMORY_DB = resolve("mcp_server", "loops", "mcp_memory.db")
LOG_SYSTEM = resolve("logs", "system-log.md")

# Additional mapped paths based on grep output
ARCHIVE_SCRIPT = resolve("ingestion", "archive_checked_emails.py")
SIGNAL_ROUTER = resolve("task_signal_router.py")
LOOP_MEMORY_DB = resolve("loop_memory.db")
MCP_MEMORY_JSON = resolve("mcp_server", "loops", "loop_memory.json")
MCP_LOG = resolve("logs", "sync_loops.out")
CONFIG_PATH = resolve("config.py")
VAULT_SNAPSHOT = resolve("vault_structure_snapshot.json")
INDEX_PATH = resolve("vector_index", "faiss_index.idx")
META_PATH = resolve("vector_index", "chunk_metadata.pkl")
EMBED_TRACK_FILE = resolve(".last_embed_sync")
EXTRACT_LOG_PATH = resolve("logs", "extract_loops.log")
WATCH_DIR = Path.home() / "ea_assistant"  # consider adjusting this to be dynamic or obsolete
