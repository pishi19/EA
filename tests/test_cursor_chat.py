from unittest.mock import patch

from src.cursor_chat import CursorChat


@patch("src.cursor_chat.logging")
def test_init(mock_logging):
    """Test the __init__ method of the CursorChat class."""
    chat = CursorChat()
    assert chat.messages == []
    assert chat.files_modified == set()
    assert chat.response_times == []
    assert chat.message_lengths == {"user": [], "assistant": []}
    assert chat.tokens_estimate == {"user": 0, "assistant": 0}
    mock_logging.basicConfig.assert_called_once()

@patch("src.cursor_chat.time.time", side_effect=[1.0, 2.0, 3.0, 4.0])
def test_add_message(mock_time):
    """Test the add_message method of the CursorChat class."""
    chat = CursorChat()

    # Add a user message
    chat.add_message("user", "Hello")
    assert len(chat.messages) == 1
    assert chat.messages[0]["role"] == "user"
    assert chat.messages[0]["content"] == "Hello"
    assert chat.message_lengths["user"] == [5]
    assert chat.tokens_estimate["user"] == 1

    # Add an assistant message
    chat.add_message("assistant", "Hi there!")
    assert len(chat.messages) == 2
    assert chat.messages[1]["role"] == "assistant"
    assert chat.messages[1]["content"] == "Hi there!"
    assert chat.message_lengths["assistant"] == [9]
    assert chat.tokens_estimate["assistant"] == 2
    assert chat.response_times == [1.0]

def test_track_file_modification():
    """Test the track_file_modification method of the CursorChat class."""
    chat = CursorChat()
    chat.track_file_modification("test_file.py")
    assert "test_file.py" in chat.files_modified

def test_clear():
    """Test the clear method of the CursorChat class."""
    chat = CursorChat()
    chat.add_message("user", "Hello")
    chat.track_file_modification("test_file.py")
    chat.clear()
    assert chat.messages == []
    assert chat.files_modified == set()

@patch("src.cursor_chat.time.time", side_effect=[1.0, 2.0, 3.0, 4.0, 5.0])
def test_calculate_metrics(mock_time):
    """Test the _calculate_metrics method of the CursorChat class."""
    chat = CursorChat()
    chat.add_message("user", "Hello")
    chat.add_message("assistant", "Hi there!")
    metrics = chat._calculate_metrics()
    assert metrics["message_count"] == 2
    assert metrics["user_messages"] == 1
    assert metrics["assistant_messages"] == 1
    assert metrics["duration"] == "3.0s"

@patch("src.cursor_chat.CursorChat._calculate_metrics")
@patch("builtins.open")
@patch("src.cursor_chat.Path.mkdir")
def test_save_session(mock_mkdir, mock_open, mock_calculate_metrics):
    """Test the save_session method of the CursorChat class."""

    # Mock the metrics
    mock_calculate_metrics.return_value = {"test_metric": "test_value"}

    chat = CursorChat()
    chat.save_session(metadata={"test_metadata": "test_value"})

    # Assertions
    mock_mkdir.assert_called_once()
    mock_open.assert_called_once()
    mock_calculate_metrics.assert_called_once()

    # Check that the content written to the file is correct
    mock_file = mock_open.return_value.__enter__.return_value
    written_content = mock_file.write.call_args[0][0]
    assert "test_metric: test_value" in written_content
    assert "test_metadata: test_value" in written_content

@patch("src.cursor_chat.CursorChat")
def test_main(mock_cursor_chat):
    """Test the main function of the cursor_chat script."""
    from src.cursor_chat import main
    main()
    mock_cursor_chat.assert_called()
    mock_chat_instance = mock_cursor_chat.return_value
    assert mock_chat_instance.add_message.call_count == 2
    assert mock_chat_instance.track_file_modification.call_count == 2
    assert mock_chat_instance.save_session.call_count == 1
