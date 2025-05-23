# API Documentation

## Overview
This document provides detailed information about the key components and their interfaces in the Ora system.

## Core Components

### Memory System

#### Vector Memory (`src/memory/vector_memory.py`)
```python
def embed_text(text: str) -> List[float]:
    """Convert text to vector embedding using OpenAI's API."""
    pass

def chunk_markdown(file_path: Path, max_chars: int = 800) -> List[Tuple[str, str]]:
    """Split markdown file into chunks for embedding."""
    pass

def build_vector_index() -> None:
    """Build and save the vector index for semantic search."""
    pass

def query_vector_memory(query: str, top_k: int = 5) -> List[Tuple[str, str]]:
    """Query the vector memory for similar content."""
    pass
```

#### Loop Memory (`src/mcp_server/interface/mcp_memory_context.py`)
```python
def get_mcp_context(limit: int = 5) -> str:
    """Get context of open loops from the database."""
    pass

def get_mcp_context_by_status(status: str = "open", limit: int = 5) -> str:
    """Get context of loops filtered by status."""
    pass

def get_mcp_context_by_tag(tag: str = "#loop", limit: int = 5) -> str:
    """Get context of loops filtered by tag."""
    pass
```

### Task Management

#### Email Task Classification (`src/ingestion/classify_structured_email_tasks.py`)
```python
def embed(text: str) -> List[float]:
    """Create embedding for task text."""
    pass

def classify_task(text: str) -> Tuple[List[str], Optional[str], float]:
    """Classify task and return tags, loop ID, and confidence score."""
    pass

def classify_and_route_tasks() -> None:
    """Main function to classify and route email tasks."""
    pass
```

### Interface

#### Streamlit App (`src/interface/streamlit_app_fixed.py`)
```python
def render() -> None:
    """Render the main Streamlit interface."""
    pass

def chat_panel() -> None:
    """Render the chat interface panel."""
    pass

def inbox_panel() -> None:
    """Render the inbox management panel."""
    pass
```

## Data Structures

### Loop Object
```python
{
    "id": str,  # Unique identifier (e.g., "loop-2025-05-21-01")
    "summary": str,  # Brief description
    "status": str,  # "open" or "closed"
    "tags": List[str],  # List of tags (e.g., ["#loop", "#systems"])
    "source": str,  # Source file reference
    "created": str,  # Creation timestamp
    "verified": bool  # Verification status
}
```

### Task Object
```python
{
    "content": str,  # Task description
    "tags": List[str],  # Classification tags
    "loop_id": Optional[str],  # Associated loop
    "confidence": float,  # Classification confidence
    "status": str,  # Task status
    "source": str  # Source reference
}
```

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: OpenAI API key
- `QDRANT_HOST`: Qdrant server host
- `QDRANT_PORT`: Qdrant server port
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)

### File Paths
- `SIGNAL_FILE`: Path to Signal_Tasks.md
- `RETRO_DIR`: Path to Retrospectives directory
- `DB_PATH`: Path to SQLite database
- `INDEX_PATH`: Path to vector index
- `META_PATH`: Path to chunk metadata

## Error Handling

### Common Exceptions
- `FileNotFoundError`: When required files are missing
- `ValueError`: When input validation fails
- `APIError`: When external API calls fail
- `DatabaseError`: When database operations fail

### Error Recovery
- Automatic retries for API calls
- Fallback mechanisms for failed operations
- Logging of all errors for debugging
- User-friendly error messages

## Logging

### Log Levels
- `DEBUG`: Detailed information for debugging
- `INFO`: General operational information
- `WARNING`: Warning messages for potential issues
- `ERROR`: Error messages for failed operations

### Log Format
```
%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

## Best Practices

### Code Style
- Follow PEP 8 guidelines
- Use type hints for all functions
- Document all public interfaces
- Write unit tests for new features

### Performance
- Use connection pooling for databases
- Implement caching where appropriate
- Optimize vector operations
- Monitor memory usage

### Security
- Never commit API keys
- Validate all user input
- Use secure connections
- Regular security audits

## Examples

### Creating a New Loop
```python
new_loop = {
    "id": "loop-2025-05-21-01",
    "summary": "System-wide delay in task automation",
    "status": "open",
    "tags": ["#loop", "#systems"],
    "source": "obsidian:/Retrospectives/2025-05-21.md"
}
```

### Querying Vector Memory
```python
results = query_vector_memory("task automation delay", top_k=5)
for source, text in results:
    print(f"Source: {source}\n{text}\n---\n")
```

### Classifying Tasks
```python
tags, loop_id, score = classify_task("Implement new feature X")
if score > 0.75:
    print(f"Task classified with tags: {tags}")
    print(f"Associated with loop: {loop_id}")
``` 