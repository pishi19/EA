#!/usr/bin/env python3
import os
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CursorSessionManager:
    def __init__(self, base_dir="sessions"):
        self.base_dir = Path(base_dir)
        self.current_session = self._get_current_session()
        
    def _get_current_session(self):
        """Get or create the current session folder (YYYY-MM-DD)"""
        today = datetime.now().strftime("%Y-%m-%d")
        session_dir = self.base_dir / today
        session_dir.mkdir(exist_ok=True)
        return session_dir
        
    def update_cursor_session(self, session_content, metadata=None):
        """Update the current session with Cursor chat content"""
        # Create cursor directory if it doesn't exist
        cursor_dir = self.current_session / "cursor"
        cursor_dir.mkdir(exist_ok=True)
        
        # Save session content
        timestamp = datetime.now().strftime("%H%M%S")
        session_file = cursor_dir / f"cursor_session_{timestamp}.md"
        
        with open(session_file, "w") as f:
            f.write("# Cursor Chat Session\n\n")
            f.write(f"Timestamp: {datetime.now().isoformat()}\n\n")
            if metadata:
                f.write("## Metadata\n\n")
                for key, value in metadata.items():
                    f.write(f"- {key}: {value}\n")
            f.write("\n## Session Content\n\n")
            f.write(session_content)
            
        # Update metrics
        self._update_metrics(session_file, metadata)
        
        logger.info(f"Cursor session updated: {session_file}")
        
    def _update_metrics(self, session_file, metadata):
        """Update metrics for the current session"""
        metrics_dir = self.current_session / "metrics"
        metrics_dir.mkdir(exist_ok=True)
        metrics_file = metrics_dir / "metrics.json"
        
        # Load existing metrics or create new
        if metrics_file.exists():
            with open(metrics_file, "r") as f:
                metrics = json.load(f)
        else:
            metrics = {}
            
        # Update cursor session metrics
        cursor_metrics = metrics.get("cursor_sessions", {})
        session_name = session_file.stem
        
        cursor_metrics[session_name] = {
            "timestamp": datetime.now().isoformat(),
            "file_size": session_file.stat().st_size,
            "metadata": metadata or {},
            "last_modified": datetime.fromtimestamp(session_file.stat().st_mtime).isoformat()
        }
        
        metrics["cursor_sessions"] = cursor_metrics
        
        # Save updated metrics
        with open(metrics_file, "w") as f:
            json.dump(metrics, f, indent=2)
            
    def cleanup_old_sessions(self, days_to_keep=30):
        """Clean up sessions older than specified days"""
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        for session_dir in self.base_dir.iterdir():
            if not session_dir.is_dir():
                continue
                
            try:
                session_date = datetime.strptime(session_dir.name, "%Y-%m-%d")
                if session_date < cutoff_date:
                    shutil.rmtree(session_dir)
                    logger.info(f"Cleaned up old session: {session_dir}")
            except ValueError:
                continue

def main():
    """Example usage"""
    manager = CursorSessionManager()
    
    # Example session content
    session_content = """
    User: How do I update the session files?
    Assistant: Let me help you with that...
    """
    
    metadata = {
        "topic": "Session Management",
        "duration": "5 minutes",
        "files_modified": ["session_manager.py"]
    }
    
    manager.update_cursor_session(session_content, metadata)
    manager.cleanup_old_sessions()

if __name__ == "__main__":
    main() 