# Memory System Documentation

## Overview
The memory system is a core component of Ora, providing both semantic (vector) and structured (SQLite) storage capabilities. It enables efficient task routing, loop management, and knowledge retrieval.

## Components

### 1. Vector Memory (`src/memory/vector_memory.py`)

#### Purpose
Provides semantic search capabilities using OpenAI's embeddings and FAISS for efficient vector similarity search.

#### Key Functions

##### `embed_text(text: str) -> List[float]`
```python
def embed_text(text: str) -> List[float]:
    """
    Convert text to vector embedding using OpenAI's API.
    
    Args:
        text (str): The text to embed
        
    Returns:
        List[float]: The embedding vector
        
    Raises:
        APIError: If the OpenAI API call fails
        ValueError: If the text is empty or too long
    """
```

##### `chunk_markdown(file_path: Path, max_chars: int = 800) -> List[Tuple[str, str]]`
```python
def chunk_markdown(file_path: Path, max_chars: int = 800) -> List[Tuple[str, str]]:
    """
    Split markdown file into chunks for embedding.
    
    Args:
        file_path (Path): Path to the markdown file
        max_chars (int): Maximum characters per chunk
        
    Returns:
        List[Tuple[str, str]]: List of (chunk_text, source_file) tuples
        
    Raises:
        FileNotFoundError: If the file doesn't exist
        ValueError: If the file is empty
    """
```

##### `build_vector_index() -> None`
```python
def build_vector_index() -> None:
    """
    Build and save the vector index for semantic search.
    
    This function:
    1. Scans configured directories for markdown files
    2. Chunks the content
    3. Creates embeddings
    4. Builds and saves the FAISS index
    
    Raises:
        FileNotFoundError: If required directories don't exist
        APIError: If embedding creation fails
        IOError: If index saving fails
    """
```

##### `query_vector_memory(query: str, top_k: int = 5) -> List[Tuple[str, str]]`
```python
def query_vector_memory(query: str, top_k: int = 5) -> List[Tuple[str, str]]:
    """
    Query the vector memory for similar content.
    
    Args:
        query (str): The search query
        top_k (int): Number of results to return
        
    Returns:
        List[Tuple[str, str]]: List of (source, text) tuples
        
    Raises:
        FileNotFoundError: If the index doesn't exist
        ValueError: If the query is invalid
    """
```

#### Configuration
```python
# === CONFIG ===
EMBED_MODEL = "text-embedding-3-small"
DATA_DIRS = [
    Path("/Users/air/AIR01/Retrospectives"),
    Path("/Users/air/AIR01/System"),
    Path("/Users/air/AIR01/0001 HQ")
]
INDEX_PATH = Path("/Users/air/ea_assistant/vector_index/faiss_index.idx")
META_PATH = Path("/Users/air/ea_assistant/vector_index/chunk_metadata.pkl")
```

### 2. Loop Memory (`src/mcp_server/interface/mcp_memory_context.py`)

#### Purpose
Manages the structured storage of loops in SQLite, providing querying and filtering capabilities.

#### Key Functions

##### `get_mcp_context(limit: int = 5) -> str`
```python
def get_mcp_context(limit: int = 5) -> str:
    """
    Get context of open loops from the database.
    
    Args:
        limit (int): Maximum number of loops to return
        
    Returns:
        str: Formatted string of loop information
        
    Raises:
        DatabaseError: If the database query fails
    """
```

##### `get_mcp_context_by_status(status: str = "open", limit: int = 5) -> str`
```python
def get_mcp_context_by_status(status: str = "open", limit: int = 5) -> str:
    """
    Get context of loops filtered by status.
    
    Args:
        status (str): Loop status to filter by
        limit (int): Maximum number of loops to return
        
    Returns:
        str: Formatted string of loop information
        
    Raises:
        DatabaseError: If the database query fails
        ValueError: If the status is invalid
    """
```

##### `get_mcp_context_by_tag(tag: str = "#loop", limit: int = 5) -> str`
```python
def get_mcp_context_by_tag(tag: str = "#loop", limit: int = 5) -> str:
    """
    Get context of loops filtered by tag.
    
    Args:
        tag (str): Tag to filter by
        limit (int): Maximum number of loops to return
        
    Returns:
        str: Formatted string of loop information
        
    Raises:
        DatabaseError: If the database query fails
    """
```

#### Database Schema
```sql
CREATE TABLE loops (
    id TEXT PRIMARY KEY,
    summary TEXT NOT NULL,
    status TEXT NOT NULL,
    tags TEXT NOT NULL,  -- JSON array of tags
    source TEXT NOT NULL,
    created TEXT NOT NULL,
    verified BOOLEAN DEFAULT FALSE
);
```

## Usage Examples

### 1. Building the Vector Index
```python
from pathlib import Path
from memory.vector_memory import build_vector_index

# Build the index
build_vector_index()
```

### 2. Querying Similar Content
```python
from memory.vector_memory import query_vector_memory

# Search for similar content
results = query_vector_memory("task automation delay", top_k=5)
for source, text in results:
    print(f"Source: {source}\n{text}\n---\n")
```

### 3. Managing Loops
```python
from mcp_server.interface.mcp_memory_context import get_mcp_context, get_mcp_context_by_tag

# Get open loops
open_loops = get_mcp_context(limit=10)

# Get loops with specific tag
system_loops = get_mcp_context_by_tag("#systems", limit=5)
```

## Performance Considerations

### Vector Memory
- Chunk size affects embedding quality and search accuracy
- FAISS index is optimized for L2 distance
- Embeddings are cached to reduce API calls
- Index is rebuilt periodically to include new content

### Loop Memory
- SQLite database is optimized for read-heavy workloads
- Tags are stored as JSON for flexible querying
- Indexes are created on frequently queried columns
- Connection pooling is used for better performance

## Error Handling

### Vector Memory Errors
1. **API Errors**
   - Implement exponential backoff
   - Cache successful embeddings
   - Log failed attempts

2. **File System Errors**
   - Validate paths before operations
   - Handle missing files gracefully
   - Maintain backup of index

### Loop Memory Errors
1. **Database Errors**
   - Use connection pooling
   - Implement retry logic
   - Log detailed error information

2. **Data Validation**
   - Validate input before storage
   - Handle malformed JSON
   - Maintain data integrity

## Monitoring

### Metrics to Track
1. **Vector Memory**
   - Embedding API latency
   - Index size and build time
   - Query response time
   - Cache hit rate

2. **Loop Memory**
   - Database query time
   - Storage usage
   - Connection pool stats
   - Error rates

### Logging
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Example usage
logger.info("Building vector index...")
logger.error("Failed to create embedding", exc_info=True)
```

## Best Practices

### Vector Memory
1. **Chunking**
   - Use semantic boundaries when possible
   - Maintain context in chunks
   - Avoid splitting important content

2. **Embeddings**
   - Cache frequently used embeddings
   - Batch embedding requests
   - Monitor API usage

3. **Indexing**
   - Regular index updates
   - Validate index integrity
   - Monitor index size

### Loop Memory
1. **Database**
   - Use transactions for writes
   - Implement proper indexing
   - Regular backups

2. **Data Management**
   - Validate input data
   - Handle concurrent access
   - Maintain data consistency

## Troubleshooting

### Common Issues

1. **Vector Memory**
   - **Issue**: Slow query response
     - **Solution**: Check index size, optimize chunk size
   - **Issue**: API rate limits
     - **Solution**: Implement caching, batch requests
   - **Issue**: Missing files
     - **Solution**: Verify paths, check permissions

2. **Loop Memory**
   - **Issue**: Database locks
     - **Solution**: Use connection pooling, implement timeouts
   - **Issue**: Corrupted data
     - **Solution**: Validate input, implement backups
   - **Issue**: Slow queries
     - **Solution**: Check indexes, optimize queries

### Debugging Tools
1. **Vector Memory**
   - Index inspection tools
   - Embedding visualization
   - Query debugging

2. **Loop Memory**
   - Database inspection
   - Query explain plans
   - Connection monitoring

## Future Improvements

### Planned Features
1. **Vector Memory**
   - Incremental index updates
   - Better chunking strategies
   - Advanced similarity metrics

2. **Loop Memory**
   - Full-text search
   - Advanced filtering
   - Real-time updates

### Performance Optimizations
1. **Vector Memory**
   - Parallel processing
   - Better caching
   - Optimized indexing

2. **Loop Memory**
   - Query optimization
   - Better concurrency
   - Enhanced monitoring 