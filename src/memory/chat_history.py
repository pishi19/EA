import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

CHAT_HISTORY_DIR = Path("data/chat_history")
CHAT_HISTORY_DIR.mkdir(parents=True, exist_ok=True)


def save_chat_history(messages: List[Dict[str, Any]], session_id: str = None) -> str:
    """
    Save chat history to a JSON file.

    Args:
        messages: List of message dictionaries
        session_id: Optional session ID. If not provided, generates one based on timestamp

    Returns:
        str: The session ID used to save the history
    """
    if session_id is None:
        # Use microseconds for uniqueness
        session_id = datetime.now().strftime("%Y%m%d_%H%M%S_%f")

    history_file = CHAT_HISTORY_DIR / f"chat_{session_id}.json"

    history_data = {
        "session_id": session_id,
        "timestamp": datetime.now().isoformat(),
        "messages": messages,
    }

    with open(history_file, "w") as f:
        json.dump(history_data, f, indent=2)

    return session_id


def load_chat_history(session_id: str) -> List[Dict[str, Any]]:
    """
    Load chat history from a JSON file.

    Args:
        session_id: The session ID to load

    Returns:
        List[Dict[str, Any]]: List of message dictionaries
    """
    history_file = CHAT_HISTORY_DIR / f"chat_{session_id}.json"

    if not history_file.exists():
        return []

    with open(history_file) as f:
        history_data = json.load(f)

    return history_data.get("messages", [])


def list_chat_sessions() -> List[Dict[str, Any]]:
    """
    List all available chat sessions.

    Returns:
        List[Dict[str, Any]]: List of session metadata
    """
    sessions = []

    for history_file in CHAT_HISTORY_DIR.glob("chat_*.json"):
        try:
            with open(history_file) as f:
                history_data = json.load(f)
                sessions.append(
                    {
                        "session_id": history_data["session_id"],
                        "timestamp": history_data["timestamp"],
                        "message_count": len(history_data["messages"]),
                    }
                )
        except Exception:
            continue

    return sorted(sessions, key=lambda x: x["timestamp"], reverse=True)


def delete_chat_history(session_id: str) -> bool:
    """
    Delete a chat history file.

    Args:
        session_id: The session ID to delete

    Returns:
        bool: True if successful, False otherwise
    """
    history_file = CHAT_HISTORY_DIR / f"chat_{session_id}.json"

    try:
        if history_file.exists():
            history_file.unlink()
        return True
    except Exception:
        return False
