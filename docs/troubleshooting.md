# Troubleshooting Guide

## Overview
This guide provides solutions for common issues that may arise when working with the Ora system. Each section includes symptoms, possible causes, and step-by-step solutions.

## Table of Contents
1. [Installation Issues](#installation-issues)
2. [Configuration Problems](#configuration-problems)
3. [Memory System Issues](#memory-system-issues)
4. [Task Management Problems](#task-management-problems)
5. [Interface Issues](#interface-issues)
6. [Performance Problems](#performance-problems)
7. [Logging and Debugging](#logging-and-debugging)

## Installation Issues

### Python Environment Problems

#### Symptom: Package Installation Fails
```
ERROR: Could not find a version that satisfies the requirement <package>
```

**Possible Causes:**
1. Python version mismatch
2. Incompatible package versions
3. Network connectivity issues
4. Virtual environment not activated

**Solutions:**
1. Verify Python version:
   ```bash
   python --version  # Should be 3.9 or higher
   ```
2. Update pip:
   ```bash
   python -m pip install --upgrade pip
   ```
3. Create fresh virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Database Setup Issues

#### Symptom: Database Connection Fails
```
sqlite3.OperationalError: unable to open database file
```

**Possible Causes:**
1. Incorrect file permissions
2. Wrong path configuration
3. Database file corruption
4. Disk space issues

**Solutions:**
1. Check file permissions:
   ```bash
   ls -l data/*.db
   ```
2. Verify database paths in configuration
3. Check disk space:
   ```bash
   df -h
   ```
4. Recreate database if corrupted:
   ```bash
   python src/scripts/init_db.py
   ```

## Configuration Problems

### Environment Variables

#### Symptom: Missing API Keys
```
ValueError: OPENAI_API_KEY not found in environment
```

**Solutions:**
1. Create a `.env` file in the project root:
   ```bash
   touch .env
   ```

2. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

3. Install python-dotenv if not already installed:
   ```bash
   pip install python-dotenv
   ```

4. Verify the API key is loaded:
   ```python
   from dotenv import load_dotenv
   import os
   
   load_dotenv()
   api_key = os.getenv("OPENAI_API_KEY")
   print(f"API key loaded: {'Yes' if api_key else 'No'}")
   ```

#### Symptom: Configuration Values Not Loading
```
AttributeError: module 'config' has no attribute 'OPENAI_API_KEY'
```

**Solutions:**
1. Check that your `.env` file is in the correct location (project root)
2. Verify the file permissions:
   ```bash
   ls -l .env
   ```
3. Ensure python-dotenv is installed and imported:
   ```bash
   pip install python-dotenv
   ```
4. Try loading environment variables explicitly:
   ```python
   from dotenv import load_dotenv
   load_dotenv(override=True)
   ```

### File Path Issues

#### Symptom: File Not Found Errors
```
FileNotFoundError: [Errno 2] No such file or directory
```

**Solutions:**
1. Check directory structure:
   ```bash
   tree -L 3
   ```
2. Verify paths in configuration
3. Create missing directories:
   ```bash
   mkdir -p data logs archive
   ```

## Memory System Issues

### Vector Memory Problems

#### Symptom: Slow Query Response
```
Query taking longer than expected
```

**Solutions:**
1. Check index size:
   ```python
   from memory.vector_memory import get_index_stats
   stats = get_index_stats()
   print(stats)
   ```
2. Optimize chunk size:
   ```python
   # In vector_memory.py
   MAX_CHUNK_SIZE = 800  # Adjust based on content
   ```
3. Rebuild index:
   ```bash
   python src/scripts/rebuild_index.py
   ```

#### Symptom: API Rate Limits
```
openai.error.RateLimitError: Rate limit exceeded
```

**Solutions:**
1. Implement caching:
   ```python
   from functools import lru_cache
   
   @lru_cache(maxsize=1000)
   def embed_text(text: str) -> List[float]:
       # ... existing code ...
   ```
2. Add retry logic:
   ```python
   from tenacity import retry, stop_after_attempt, wait_exponential
   
   @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
   def embed_text(text: str) -> List[float]:
       # ... existing code ...
   ```

### Loop Memory Problems

#### Symptom: Database Locks
```
sqlite3.OperationalError: database is locked
```

**Solutions:**
1. Use connection pooling:
   ```python
   from sqlalchemy import create_engine
   from sqlalchemy.pool import QueuePool
   
   engine = create_engine('sqlite:///data/loops.db',
                         poolclass=QueuePool,
                         pool_size=5,
                         max_overflow=10)
   ```
2. Implement timeouts:
   ```python
   import sqlite3
   
   conn = sqlite3.connect('data/loops.db', timeout=30)
   ```

#### Symptom: Corrupted Data
```
json.decoder.JSONDecodeError: Expecting value
```

**Solutions:**
1. Validate input:
   ```python
   def validate_loop_data(data: dict) -> bool:
       required_fields = ['id', 'summary', 'status', 'tags']
       return all(field in data for field in required_fields)
   ```
2. Implement backups:
   ```bash
   python src/scripts/backup_db.py
   ```

## Task Management Problems

### Email Task Classification

#### Symptom: Low Classification Accuracy
```
Confidence scores below threshold
```

**Solutions:**
1. Adjust confidence threshold:
   ```python
   MIN_CONFIDENCE = 0.75  # Adjust based on needs
   ```
2. Improve prompt engineering:
   ```python
   CLASSIFICATION_PROMPT = """
   Analyze the following task and classify it:
   {task_text}
   
   Consider:
   - Task type
   - Priority
   - Related projects
   - Required skills
   """
   ```

### Task Routing Issues

#### Symptom: Tasks Not Being Routed
```
Tasks remain unclassified
```

**Solutions:**
1. Check task format:
   ```python
   def validate_task_format(task: str) -> bool:
       return task.strip().startswith("- [ ]")
   ```
2. Verify routing logic:
   ```python
   def route_task(task: str) -> None:
       logger.info(f"Routing task: {task}")
       # ... routing logic ...
   ```

## Interface Issues

### Streamlit App Problems

#### Symptom: App Not Starting
```
streamlit.errors.StreamlitAPIException: ...
```

**Solutions:**
1. Check dependencies:
   ```bash
   pip install streamlit==1.22.0
   ```
2. Verify port availability:
   ```bash
   lsof -i :8501
   ```
3. Clear cache:
   ```bash
   streamlit cache clear
   ```

#### Symptom: UI Not Updating
```
Changes not reflected in interface
```

**Solutions:**
1. Force refresh:
   ```python
   st.experimental_rerun()
   ```
2. Check state management:
   ```python
   if 'key' not in st.session_state:
       st.session_state.key = 'value'
   ```

## Performance Problems

### Slow Response Times

#### Symptom: High Latency
```
Operations taking longer than expected
```

**Solutions:**
1. Profile code:
   ```python
   import cProfile
   
   profiler = cProfile.Profile()
   profiler.enable()
   # ... code to profile ...
   profiler.disable()
   profiler.print_stats(sort='cumulative')
   ```
2. Optimize database queries:
   ```sql
   EXPLAIN QUERY PLAN
   SELECT * FROM loops WHERE status = 'open';
   ```

### Memory Usage

#### Symptom: High Memory Consumption
```
Memory usage growing over time
```

**Solutions:**
1. Monitor memory:
   ```python
   import psutil
   
   process = psutil.Process()
   print(process.memory_info().rss / 1024 / 1024)  # MB
   ```
2. Implement cleanup:
   ```python
   import gc
   
   def cleanup():
       gc.collect()
   ```

## Logging and Debugging

### Log Analysis

#### Symptom: Missing Logs
```
Expected log entries not found
```

**Solutions:**
1. Check log configuration:
   ```python
   logging.basicConfig(
       level=logging.INFO,
       format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
       handlers=[
           logging.FileHandler('logs/app.log'),
           logging.StreamHandler()
       ]
   )
   ```
2. Verify log rotation:
   ```python
   from logging.handlers import RotatingFileHandler
   
   handler = RotatingFileHandler(
       'logs/app.log',
       maxBytes=1024*1024,  # 1MB
       backupCount=5
   )
   ```

### Debugging Tools

#### Symptom: Hard to Debug Issues
```
Complex problems requiring investigation
```

**Solutions:**
1. Use debug logging:
   ```python
   logger.debug("Variable value: %s", value)
   ```
2. Implement tracing:
   ```python
   import traceback
   
   try:
       # ... code ...
   except Exception as e:
       logger.error("Error: %s\n%s", e, traceback.format_exc())
   ```

## Getting Help

If you're still experiencing issues:

1. Check the logs in `logs/` directory
2. Review the documentation in `docs/`
3. Search for similar issues in the issue tracker
4. Create a new issue with:
   - Detailed description of the problem
   - Steps to reproduce
   - Relevant logs and error messages
   - System information

## Contributing to This Guide

If you find a solution to a common issue:

1. Document the problem and solution
2. Follow the existing format
3. Include code examples
4. Submit a pull request

Remember to:
- Be clear and concise
- Include all necessary steps
- Provide code examples
- Explain the reasoning 