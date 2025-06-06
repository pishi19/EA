from unittest.mock import MagicMock, patch

from src.create_test_session import create_test_sessions


@patch("src.create_test_session.CursorChat")
def test_create_test_sessions(mock_cursor_chat):
    """Test the create_test_sessions function."""

    # Mock the CursorChat class
    mock_chat_instance = MagicMock()
    mock_cursor_chat.return_value = mock_chat_instance

    create_test_sessions()

    # Assert that the chat methods were called
    assert mock_chat_instance.add_message.call_count > 0
    assert mock_chat_instance.track_file_modification.call_count > 0
    assert mock_chat_instance.save_session.call_count == 6
    assert mock_chat_instance.clear.call_count == 5
