from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import List


@dataclass
class Signal:
    content: str
    source: str           # e.g., 'retrospective', 'inbox', 'gpt_ui'
    timestamp: datetime
    tags: List[str] = field(default_factory=list)

def collect_signals() -> List[Signal]:
    signals = []
    # Determine project root assuming this script is in src/signals/collector.py
    # project_root will be /path/to/ea_cursor_system_coupled
    project_root = Path(__file__).resolve().parent.parent.parent
    retrospective_path = project_root / "runtime/retrospectives"

    if not retrospective_path.exists():
        # Handle the case where the directory doesn't exist
        print(f"Warning: Retrospectives directory not found at {retrospective_path}")
        return signals # signals is an empty list here

    for file in retrospective_path.glob("*.md"):
        try:
            content = file.read_text(encoding="utf-8")
            timestamp = datetime.fromtimestamp(file.stat().st_mtime)
            signals.append(Signal(
                content=content,
                source="retrospective",
                timestamp=timestamp,
                tags=[]
            ))
        except Exception as e:
            print(f"Error processing file {file}: {e}")
            # Optionally, skip this file and continue

    return signals

# Example usage
if __name__ == "__main__":
    # This example demonstrates how to use collect_signals.
    # It also includes setup for creating dummy files for testing purposes.

    # Define the path to retrospective files for the example
    # Assuming this script is in src/signals/collector.py
    example_project_root = Path(__file__).resolve().parent.parent.parent
    example_retrospectives_dir = example_project_root / "runtime/retrospectives"

    # Create dummy directory and files for testing if they don't exist
    if not example_retrospectives_dir.exists():
        print(f"Creating dummy directory for testing: {example_retrospectives_dir}")
        example_retrospectives_dir.mkdir(parents=True, exist_ok=True)

    if not list(example_retrospectives_dir.glob("*.md")):
        print(f"Creating dummy .md files in {example_retrospectives_dir} for testing collect_signals.")
        (example_retrospectives_dir / "retro_example_1.md").write_text("This is the first retrospective example.")
        (example_retrospectives_dir / "retro_example_2.md").write_text("This is another retrospective, detailing key learnings.")

    collected_signals = collect_signals()
    if collected_signals:
        print(f"\nCollected {len(collected_signals)} signals:")
        for sig_idx, sig in enumerate(collected_signals):
            print(f"  Signal {sig_idx + 1}:")
            print(f"    Source: {sig.source}")
            print(f"    Timestamp: {sig.timestamp.isoformat()}")
            print(f"    Tags: {sig.tags}")
            content_preview = sig.content[:70].replace('\n', ' ')
            print(f"    Content: '{content_preview}...'")
    else:
        print(f"\nNo signals collected. Ensure '{example_retrospectives_dir}' contains .md files.")
