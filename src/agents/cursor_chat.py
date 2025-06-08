#!/usr/bin/env python3
import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Any


class CursorChat:
    def __init__(self):
        self.messages = []
        self.files_modified = set()
        self.start_time = time.time()
        self.response_times = []
        self.last_message_time = self.start_time
        self.message_lengths = {"user": [], "assistant": []}
        self.tokens_estimate = {"user": 0, "assistant": 0}
        self.setup_logging()

    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
        self.logger = logging.getLogger(__name__)

    def add_message(self, role: str, content: str):
        """Add a message to the chat and track metrics"""
        current_time = time.time()

        # Calculate response time for assistant messages
        if role == "assistant" and self.messages and self.messages[-1]["role"] == "user":
            response_time = current_time - self.last_message_time
            self.response_times.append(response_time)

        # Track message length and estimate tokens
        message_length = len(content)
        self.message_lengths[role].append(message_length)
        # Rough token estimate: 1 token ≈ 4 characters
        self.tokens_estimate[role] += message_length // 4

        # Add message to history
        self.messages.append(
            {"role": role, "content": content, "timestamp": datetime.now().isoformat()}
        )

        self.last_message_time = current_time

    def track_file_modification(self, file_path: str):
        """Track a file that was modified during the chat"""
        self.files_modified.add(file_path)

    def clear(self):
        """Clear the current chat session"""
        self.messages = []
        self.files_modified = set()
        self.start_time = time.time()
        self.response_times = []
        self.last_message_time = self.start_time
        self.message_lengths = {"user": [], "assistant": []}
        self.tokens_estimate = {"user": 0, "assistant": 0}

    def _calculate_metrics(self) -> dict[str, Any]:
        """Calculate comprehensive metrics for the session"""
        total_messages = len(self.messages)
        user_messages = len([m for m in self.messages if m["role"] == "user"])
        assistant_messages = len([m for m in self.messages if m["role"] == "assistant"])

        # Calculate response time statistics
        avg_response_time = (
            sum(self.response_times) / len(self.response_times) if self.response_times else 0
        )
        median_response_time = (
            sorted(self.response_times)[len(self.response_times) // 2] if self.response_times else 0
        )

        # Calculate message length statistics
        avg_user_length = (
            sum(self.message_lengths["user"]) / len(self.message_lengths["user"])
            if self.message_lengths["user"]
            else 0
        )
        avg_assistant_length = (
            sum(self.message_lengths["assistant"]) / len(self.message_lengths["assistant"])
            if self.message_lengths["assistant"]
            else 0
        )

        # Calculate session duration
        duration = time.time() - self.start_time

        return {
            "message_count": total_messages,
            "user_messages": user_messages,
            "assistant_messages": assistant_messages,
            "duration": f"{duration:.1f}s",
            "response_times": {
                "average": f"{avg_response_time:.1f}s",
                "median": f"{median_response_time:.1f}s",
                "min": (f"{min(self.response_times):.1f}s" if self.response_times else "0s"),
                "max": (f"{max(self.response_times):.1f}s" if self.response_times else "0s"),
            },
            "message_patterns": {
                "avg_user_message_length": int(avg_user_length),
                "avg_assistant_message_length": int(avg_assistant_length),
                "total_tokens_estimate": self.tokens_estimate["user"]
                + self.tokens_estimate["assistant"],
            },
            "files_modified": list(self.files_modified),
            "interaction_density": (
                f"{total_messages / duration:.1f} messages/min"
                if duration > 0
                else "0 messages/min"
            ),
        }

    def save_session(self, metadata: dict[str, Any] = None):
        """Save the chat session with metrics"""
        if not metadata:
            metadata = {}

        # Create sessions directory structure
        date_str = datetime.now().strftime("%Y-%m-%d")
        sessions_dir = Path("sessions") / date_str / "cursor"
        sessions_dir.mkdir(parents=True, exist_ok=True)

        # Generate session filename
        timestamp = datetime.now().strftime("%H%M%S")
        session_file = sessions_dir / f"cursor_session_{timestamp}.md"

        # Calculate metrics
        metrics = self._calculate_metrics()

        # Combine metadata and metrics
        session_data = {**metadata, **metrics}

        # Format the session content
        content = "---\n"
        for key, value in session_data.items():
            if isinstance(value, (list, dict)):
                content += f"{key}: {json.dumps(value)}\n"
            else:
                content += f"{key}: {value}\n"
        content += "---\n\n"

        # Add chat messages
        for message in self.messages:
            content += (
                f"**{message['role'].title()}** ({message['timestamp']}):\n{message['content']}\n\n"
            )

        # Save the session file
        with open(session_file, "w") as f:
            f.write(content)

        self.logger.info(f"Cursor session updated: {session_file}")

        # Clear the session after saving
        self.clear()


def main():
    """Example usage"""
    chat = CursorChat()

    # Simulate a chat session
    chat.add_message("user", "How do I update the session files?")
    chat.track_file_modification("src/session_manager.py")

    # Simulate some time passing
    time.sleep(2)

    chat.add_message("assistant", "Let me help you with that...")
    chat.track_file_modification("src/cursor_chat.py")

    # Save the session
    chat.save_session(
        {
            "topic": "Session Management",
            "files_modified": ["session_manager.py", "cursor_chat.py"],
        }
    )


if __name__ == "__main__":
    main()
