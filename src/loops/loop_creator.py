import hashlib
import uuid
from datetime import datetime
from pathlib import Path

import yaml

from src.signals.collector import Signal  # Corrected import

# Determine project root assuming this script is in src/loops/loop_creator.py
# project_root will be /path/to/ea_cursor_system_coupled
project_root = Path(__file__).resolve().parent.parent.parent
LOOP_DIR = project_root / "runtime/loops"

def deterministic_uuid(text: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, hashlib.sha256(text.encode()).hexdigest()))

def slugify(text: str, max_length: int = 32) -> str:
    # Ensure text is not empty before trying to access splitlines[0] or other operations
    if not text:
        return "untitled"
    # Replace non-alnum characters with hyphens, convert to lowercase
    # Limit length, and remove leading/trailing hyphens
    slug = "".join(c if c.isalnum() else "-" for c in str(text).lower())
    # Collapse multiple hyphens
    slug = "-".join(filter(None, slug.split("-")))
    return slug[:max_length].strip("-")

def create_loop_from_signal(signal: Signal) -> Path:
    LOOP_DIR.mkdir(parents=True, exist_ok=True)

    uid = deterministic_uuid(signal.content)
    # Use the first line of content for slug, or "untitled" if content is empty/whitespace
    first_line = signal.content.strip().splitlines()[0] if signal.content.strip() else "untitled"
    slug = slugify(first_line)
    date_str = signal.timestamp.strftime("%Y-%m-%d")

    # Ensure filename is not too long and handle potential empty slug
    filename_base = f"loop-{date_str}-{slug if slug else 'untitled'}"
    filename = f"{filename_base[:200]}.md" # Cap filename length before .md
    path = LOOP_DIR / filename

    frontmatter = {
        "uuid": uid,
        "source": signal.source,
        "tags": signal.tags,
        "created": signal.timestamp.isoformat(),
        "routed": False  # Default value as in the original script
    }

    # Ensure signal.content is stripped to remove leading/trailing whitespace
    content = f"---\n{yaml.safe_dump(frontmatter)}---\n\n{signal.content.strip()}"
    path.write_text(content, encoding="utf-8")

    return path

if __name__ == "__main__":
    # Example Signal
    example_signal = Signal(
        content="This is the first line of a test signal for loop creation.\nAnd this is the second line, offering more details.",
        source="test_source_loop_creator",
        timestamp=datetime.now(),
        tags=["test_loop", "example_creation"]
    )

    # Create a loop file from the signal
    print(f"Attempting to create loop file in: {LOOP_DIR.resolve()}")
    try:
        loop_file_path = create_loop_from_signal(example_signal)
        print(f"Successfully created loop file: {loop_file_path.resolve()}")
        print("\nFile content:")
        print(loop_file_path.read_text(encoding="utf-8"))

        # Create another signal with minimal content to test slugify
        minimal_signal = Signal(
            content="  ", # Whitespace content
            source="minimal_source",
            timestamp=datetime.now(),
            tags=["minimal"]
        )
        print("\nAttempting to create loop file from minimal signal...")
        minimal_loop_path = create_loop_from_signal(minimal_signal)
        print(f"Successfully created minimal loop file: {minimal_loop_path.resolve()}")
        print("\nMinimal File content:")
        print(minimal_loop_path.read_text(encoding="utf-8"))

    except Exception as e:
        print(f"Error creating loop file: {e}")
