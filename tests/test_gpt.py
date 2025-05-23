import os
import sys
from unittest.mock import MagicMock, patch

import pytest

# Ensure we can import from ea_assistant root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src", "gpt_supervised")))

from chat_with_gpt import chat_with_gpt


@pytest.fixture
def mock_openai_response():
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "This is a mocked GPT reply."
    return mock_response


@patch("chat_with_gpt.client.chat.completions.create")
def test_chat_with_gpt_constructs_prompt(mock_create, mock_openai_response):
    mock_create.return_value = mock_openai_response
    response = chat_with_gpt("What is Ora's purpose?")
    assert "mocked gpt reply" in response.lower()
    mock_create.assert_called_once()
    messages = mock_create.call_args[1]["messages"]
    assert any(
        "Context from recent memory loops" in m["content"]
        for m in messages
        if m["role"] == "system"
    )
    assert any("What is Ora's purpose?" in m["content"] for m in messages if m["role"] == "user")
