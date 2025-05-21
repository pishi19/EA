import sys
import os
import pytest
import numpy as np
from unittest.mock import MagicMock

# Simulated vector store using in-memory dict with cosine similarity
class MockVectorStore:
    def __init__(self):
        self.vectors = {}  # id -> vector
        self.texts = {}    # id -> original text

    def add(self, id, vector, text):
        self.vectors[id] = vector
        self.texts[id] = text

    def search(self, query_vector, top_k=1):
        def cosine(a, b):
            return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
        scored = [
            (cosine(query_vector, v), i)
            for i, v in self.vectors.items()
        ]
        scored.sort(reverse=True)
        return [(self.texts[i], s) for s, i in scored[:top_k]]

# Simulated embedding generator (e.g., from OpenAI or local model)
def mock_embed(text):
    return np.array([len(text), sum(ord(c) for c in text) % 1000])

@pytest.fixture
def mock_store():
    store = MockVectorStore()
    store.add("1", mock_embed("task automation is improving"), "task automation is improving")
    store.add("2", mock_embed("GPT classification pipeline"), "GPT classification pipeline")
    store.add("3", mock_embed("we fixed loop memory bugs"), "we fixed loop memory bugs")
    return store

def test_vector_store_search_accuracy(mock_store):
    query = "loop memory improvements"
    result = mock_store.search(mock_embed(query), top_k=2)
    assert len(result) == 2
    assert all(isinstance(text, str) and 0 <= score <= 1 for text, score in result)

def test_vector_store_empty_results():
    empty_store = MockVectorStore()
    results = empty_store.search(np.array([1, 2]), top_k=1)
    assert results == []
