from unittest.mock import MagicMock, patch

import numpy as np
import pandas as pd

from src.tasks.similarity import cosine_similarity, find_similar_tasks, get_embedding


@patch("src.tasks.similarity.OpenAI")
def test_get_embedding(mock_openai):
    """Test the get_embedding function."""
    mock_client = MagicMock()
    mock_openai.return_value = mock_client
    mock_embedding = MagicMock()
    mock_embedding.embedding = [1.0, 2.0, 3.0]
    mock_client.embeddings.create.return_value = MagicMock(data=[mock_embedding])

    embedding = get_embedding("test")

    assert isinstance(embedding, np.ndarray)
    assert embedding.shape == (3,)
    np.testing.assert_array_equal(embedding, np.array([1.0, 2.0, 3.0]))

def test_cosine_similarity():
    """Test the cosine_similarity function."""
    v1 = np.array([1, 0, 0])
    v2 = np.array([0, 1, 0])
    assert cosine_similarity(v1, v2) == 0.0
    assert cosine_similarity(v1, v1) == 1.0
    assert cosine_similarity(v1, -v1) == -1.0
    assert cosine_similarity(v1, np.array([0, 0, 0])) == 0.0

@patch("src.tasks.similarity.sqlite3.connect")
@patch("src.tasks.similarity.get_embedding")
@patch("src.tasks.similarity.pd.read_sql")
def test_find_similar_tasks(mock_read_sql, mock_get_embedding, mock_connect, tmp_path):
    """Test the find_similar_tasks function."""
    db_path = tmp_path / "ora.db"

    # Mock the database
    mock_connect.return_value = MagicMock()

    # Mock the embedding
    embedding = np.random.rand(1536).astype(np.float32)
    mock_get_embedding.return_value = embedding

    # Mock the dataframe
    df = pd.DataFrame({
        "uuid": ["uuid1", "uuid2"],
        "workstream": ["ws1", "ws2"],
        "verb": ["verb1", "verb2"],
        "vector": [embedding.tobytes(), np.random.rand(1536).astype(np.float32).tobytes()],
        "source_loop_id": ["loop1", "loop2"]
    })
    mock_read_sql.return_value = df

    db_path.touch()
    tasks = find_similar_tasks("test", db_path=db_path)

    assert len(tasks) == 1
    assert tasks[0]["task_uuid"] == "uuid1"
    assert tasks[0]["similarity"] == 1.0

@patch("src.tasks.similarity.get_embedding", return_value=None)
def test_find_similar_tasks_no_embedding(mock_get_embedding):
    """Test the find_similar_tasks function when no embedding can be generated."""
    result = find_similar_tasks("test")
    assert "error" in result

@patch("src.tasks.similarity.sqlite3.connect")
@patch("src.tasks.similarity.get_embedding", return_value=np.array([1.0, 0.0, 0.0]))
@patch("src.tasks.similarity.pd.read_sql", side_effect=pd.io.sql.DatabaseError("DB error"))
def test_find_similar_tasks_db_error(mock_read_sql, mock_get_embedding, mock_connect, tmp_path):
    """Test the find_similar_tasks function when there is a database error."""
    db_path = tmp_path / "ora.db"
    db_path.touch()
    result = find_similar_tasks("test", db_path=db_path)
    assert "error" in result

@patch("src.tasks.similarity.sqlite3.connect")
@patch("src.tasks.similarity.get_embedding", return_value=np.array([1.0, 0.0, 0.0]))
@patch("src.tasks.similarity.pd.read_sql", return_value=pd.DataFrame())
def test_find_similar_tasks_empty_df(mock_read_sql, mock_get_embedding, mock_connect, tmp_path):
    """Test the find_similar_tasks function when the dataframe is empty."""
    db_path = tmp_path / "ora.db"
    db_path.touch()
    tasks = find_similar_tasks("test", db_path=db_path)
    assert tasks == []

@patch("src.tasks.similarity.OpenAI", side_effect=Exception("API error"))
def test_get_embedding_error(mock_openai):
    """Test the get_embedding function when there is an API error."""
    embedding = get_embedding("test")
    assert embedding is None

@patch("src.tasks.similarity.sqlite3.connect")
@patch("src.tasks.similarity.get_embedding", return_value=np.array([1.0, 0.0]))
@patch("src.tasks.similarity.pd.read_sql")
def test_find_similar_tasks_mismatched_dims(mock_read_sql, mock_get_embedding, mock_connect, tmp_path):
    """Test the find_similar_tasks function with mismatched vector dimensions."""
    db_path = tmp_path / "ora.db"

    # Mock the database
    mock_connect.return_value = MagicMock()

    # Mock the dataframe
    df = pd.DataFrame({
        "uuid": ["uuid1"],
        "workstream": ["ws1"],
        "verb": ["verb1"],
        "vector": [np.random.rand(1536).astype(np.float32).tobytes()],
        "source_loop_id": ["loop1"]
    })
    mock_read_sql.return_value = df

    db_path.touch()
    tasks = find_similar_tasks("test", db_path=db_path)
    assert tasks == []
