import pytest
import pandas as pd
import json
from pathlib import Path
from datetime import datetime
from src.cursor_dashboard import CursorDashboard
import numpy as np

@pytest.fixture
def sample_session_data():
    return {
        "topic": "Testing",
        "plan_area": "Development",
        "complexity": "medium",
        "success": True,
        "files_modified": ["test1.py", "test2.py"],
        "accomplishments": ["Test case 1", "Test case 2"],
        "duration": "5m",
        "response_times": {"avg": 1.5},
        "message_patterns": {"user": 3, "assistant": 3}
    }

@pytest.fixture
def dashboard():
    return CursorDashboard()

def test_load_metrics_empty(dashboard, tmp_path):
    """Test loading metrics when no session files exist"""
    dashboard.sessions_dir = tmp_path
    metrics = dashboard.load_metrics()
    assert isinstance(metrics, pd.DataFrame)
    assert metrics.empty

def test_load_metrics_with_data(dashboard, tmp_path, sample_session_data):
    """Test loading metrics with sample session data"""
    # Create a test session file
    session_dir = tmp_path / "2025-05-23" / "cursor"
    session_dir.mkdir(parents=True)
    session_file = session_dir / "cursor_session_190000.md"
    
    # Write test data
    content = f"""---
{json.dumps(sample_session_data)}
---
Test content
"""
    session_file.write_text(content)
    
    # Test loading
    dashboard.sessions_dir = tmp_path
    metrics = dashboard.load_metrics()
    
    assert not metrics.empty
    assert "topic" in metrics.columns
    assert metrics.iloc[0]["topic"] == "Testing"
    assert metrics.iloc[0]["plan_area"] == "Development"
    assert isinstance(metrics.iloc[0]["files_modified"], list)
    assert len(metrics.iloc[0]["files_modified"]) == 2

def test_metrics_data_types(dashboard, tmp_path, sample_session_data):
    """Test that metrics are loaded with correct data types"""
    # Create test session file
    session_dir = tmp_path / "2025-05-23" / "cursor"
    session_dir.mkdir(parents=True)
    session_file = session_dir / "cursor_session_190000.md"
    
    # Write test data
    content = f"""---
{json.dumps(sample_session_data)}
---
Test content
"""
    session_file.write_text(content)
    
    # Test loading
    dashboard.sessions_dir = tmp_path
    metrics = dashboard.load_metrics()
    
    # Check data types
    assert isinstance(metrics.iloc[0]["success"], (bool, np.bool_))
    assert isinstance(metrics.iloc[0]["files_modified"], list)
    assert isinstance(metrics.iloc[0]["response_times"], dict)
    assert isinstance(metrics.iloc[0]["message_patterns"], dict)

def test_accomplishments_parsing(dashboard, tmp_path):
    """Test parsing of different accomplishment formats"""
    test_cases = [
        {"accomplishments": ["Item 1", "Item 2"]},
        {"accomplishments": "Single item"},
        {"accomplishments": 123},
        {"accomplishments": None}
    ]
    
    for i, test_data in enumerate(test_cases):
        session_dir = tmp_path / "2025-05-23" / "cursor"
        session_dir.mkdir(parents=True, exist_ok=True)
        session_file = session_dir / f"cursor_session_19000{i}.md"
        
        content = f"""---
{json.dumps(test_data)}
---
Test content
"""
        session_file.write_text(content)
    
    dashboard.sessions_dir = tmp_path
    metrics = dashboard.load_metrics()
    
    # Verify all accomplishments are lists
    for _, row in metrics.iterrows():
        acc = row.get("accomplishments", [])
        assert isinstance(acc, list)
        if acc:  # If not empty
            assert all(isinstance(item, str) for item in acc)

def test_files_modified_parsing(dashboard, tmp_path):
    """Test parsing of different files_modified formats"""
    test_cases = [
        {"files_modified": ["file1.py", "file2.py"]},
        {"files_modified": "file1.py,file2.py"},
        {"files_modified": None}
    ]
    
    for i, test_data in enumerate(test_cases):
        session_dir = tmp_path / "2025-05-23" / "cursor"
        session_dir.mkdir(parents=True, exist_ok=True)
        session_file = session_dir / f"cursor_session_19000{i}.md"
        
        content = f"""---
{json.dumps(test_data)}
---
Test content
"""
        session_file.write_text(content)
    
    dashboard.sessions_dir = tmp_path
    metrics = dashboard.load_metrics()
    
    # Verify all files_modified are lists
    for _, row in metrics.iterrows():
        files = row.get("files_modified", [])
        assert isinstance(files, list)

def test_required_fields(dashboard, tmp_path):
    """Test that required fields are set with default values"""
    # Create minimal test data
    test_data = {"topic": "Test"}
    session_dir = tmp_path / "2025-05-23" / "cursor"
    session_dir.mkdir(parents=True)
    session_file = session_dir / "cursor_session_190000.md"
    
    content = f"""---
{json.dumps(test_data)}
---
Test content
"""
    session_file.write_text(content)
    
    dashboard.sessions_dir = tmp_path
    metrics = dashboard.load_metrics()
    
    # Check default values
    assert metrics.iloc[0]["complexity"] == "medium"
    assert metrics.iloc[0]["success"] == True
    assert isinstance(metrics.iloc[0]["files_modified"], list)
    assert len(metrics.iloc[0]["files_modified"]) == 0

def test_visualization_data_preparation(dashboard, tmp_path, sample_session_data):
    """Test data preparation for visualizations"""
    # Create test session files with different topics and complexities
    test_data = [
        {**sample_session_data, "topic": "Topic1", "complexity": "low"},
        {**sample_session_data, "topic": "Topic2", "complexity": "medium"},
        {**sample_session_data, "topic": "Topic1", "complexity": "high"}
    ]
    
    session_dir = tmp_path / "2025-05-23" / "cursor"
    session_dir.mkdir(parents=True)
    
    for i, data in enumerate(test_data):
        session_file = session_dir / f"cursor_session_19000{i}.md"
        content = f"""---
{json.dumps(data)}
---
Test content
"""
        session_file.write_text(content)
    
    dashboard.sessions_dir = tmp_path
    metrics = dashboard.load_metrics()
    
    # Test topic distribution data
    topic_counts = metrics["topic"].value_counts()
    assert len(topic_counts) == 2  # Two unique topics
    assert topic_counts["Topic1"] == 2
    assert topic_counts["Topic2"] == 1
    
    # Test complexity analysis data
    complexity_counts = metrics["complexity"].value_counts()
    assert len(complexity_counts) == 3  # Three unique complexities
    assert complexity_counts["low"] == 1
    assert complexity_counts["medium"] == 1
    assert complexity_counts["high"] == 1
    
    # Test success rate by topic
    success_by_topic = metrics.groupby("topic")["success"].mean()
    assert len(success_by_topic) == 2
    assert all(rate == 1.0 for rate in success_by_topic)  # All True in sample data

def test_files_modified_visualization(dashboard, tmp_path):
    """Test files modified visualization data preparation"""
    test_data = [
        {"files_modified": ["file1.py", "file2.py"]},
        {"files_modified": ["file1.py", "file3.py"]},
        {"files_modified": ["file2.py"]}
    ]
    
    session_dir = tmp_path / "2025-05-23" / "cursor"
    session_dir.mkdir(parents=True)
    
    for i, data in enumerate(test_data):
        session_file = session_dir / f"cursor_session_19000{i}.md"
        content = f"""---
{json.dumps(data)}
---
Test content
"""
        session_file.write_text(content)
    
    dashboard.sessions_dir = tmp_path
    metrics = dashboard.load_metrics()
    
    # Test file counts preparation
    all_files = []
    for files in metrics["files_modified"]:
        if isinstance(files, list):
            all_files.extend(files)
        elif isinstance(files, str):
            all_files.extend(files.split(","))
    
    file_counts = pd.Series(all_files).value_counts()
    assert len(file_counts) == 3  # Three unique files
    assert file_counts["file1.py"] == 2
    assert file_counts["file2.py"] == 2
    assert file_counts["file3.py"] == 1

def test_empty_metrics_handling(dashboard, tmp_path):
    """Test handling of empty metrics DataFrame"""
    dashboard.sessions_dir = tmp_path
    metrics = dashboard.load_metrics()
    
    # Test empty metrics handling
    assert metrics.empty
    assert isinstance(metrics, pd.DataFrame)
    assert len(metrics) == 0
    assert all(col in metrics.columns for col in ["topic", "complexity", "success", "files_modified"])

def test_invalid_metadata_handling(dashboard, tmp_path):
    """Test handling of invalid metadata in session files"""
    # Create test files with invalid metadata
    test_cases = [
        "---\ninvalid: yaml: content\n---",
        "---\n{'invalid': 'json'}\n---",
        "No metadata at all"
    ]
    
    session_dir = tmp_path / "2025-05-23" / "cursor"
    session_dir.mkdir(parents=True)
    
    for i, content in enumerate(test_cases):
        session_file = session_dir / f"cursor_session_19000{i}.md"
        session_file.write_text(content)
    
    dashboard.sessions_dir = tmp_path
    metrics = dashboard.load_metrics()
    
    # Should handle invalid files gracefully
    assert isinstance(metrics, pd.DataFrame)
    assert len(metrics) == 0  # Invalid files should be skipped 