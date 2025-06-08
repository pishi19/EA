import os

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError(
        "OPENAI_API_KEY not found in environment. "
        "Please set it using: export OPENAI_API_KEY=your_key_here"
    )
