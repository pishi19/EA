# 📊 Status Writer – Tracks system view + loop state

import json
from datetime import datetime
from pathlib import Path

STATUS_PATH = Path("System/status.json")

def write_status(view: str, loop_id: str = "", roadmap_id: str = "", action: str = ""):
    status = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "active_view": view,
        "active_loop_id": loop_id,
        "roadmap_id": roadmap_id,
        "last_action": action,
    }
    STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATUS_PATH.write_text(json.dumps(status, indent=2))
    status["path"] = str(STATUS_PATH)
    return status
