from pathlib import Path

import yaml

# Create a dummy signal file for testing the collector
signal_data = {
    "source": "test_signal",
    "content": "This is a test signal.",
    "tags": ["test", "signal"],
    "created_at": "2025-06-03T10:00:00Z"
}

signal_file = Path.home() / "ea_assistant" / "signals" / "test_signal.yaml"
signal_file.parent.mkdir(parents=True, exist_ok=True)
with open(signal_file, "w") as f:
    yaml.dump(signal_data, f)

print(f"✅ Created dummy signal: {signal_file}")
