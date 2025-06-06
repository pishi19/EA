import pytest
from src.ea_assistant import format_events, get_calendar_events, generate_daily_note, write_daily_note, write_log, LOG_PATH, TOKEN_PATH
from unittest.mock import patch, MagicMock
from datetime import datetime

def test_format_events():
    """Test the format_events function."""
    # Test with a list of events
    events = [
        {"start": {"dateTime": "2023-01-01T10:00:00"}, "summary": "Event 1"},
        {"start": {"date": "2023-01-02"}, "summary": "Event 2"},
    ]
    formatted_events = format_events(events)
    assert "2023-01-01T10:00:00: Event 1" in formatted_events
    assert "2023-01-02: Event 2" in formatted_events
    
    # Test with no events
    formatted_events = format_events([])
    assert formatted_events == "No meetings scheduled today."
    
    # Test with an event with no summary
    events = [{"start": {"dateTime": "2023-01-01T10:00:00"}}]
    formatted_events = format_events(events)
    assert "(No title)" in formatted_events

@patch("src.ea_assistant.build")
@patch("src.ea_assistant.InstalledAppFlow")
@patch("src.ea_assistant.Credentials")
@patch("builtins.open")
@patch("src.ea_assistant.os.path.exists", return_value=False)
def test_get_calendar_events_no_token(mock_exists, mock_open, mock_credentials, mock_flow, mock_build):
    """Test the get_calendar_events function when no token file exists."""
    # Mock the Google API client
    mock_service = MagicMock()
    mock_build.return_value = mock_service
    mock_events = MagicMock()
    mock_service.events.return_value = mock_events
    mock_events.list.return_value.execute.return_value = {"items": ["event1", "event2"]}

    # Mock the credentials
    mock_creds = MagicMock()
    mock_credentials.from_authorized_user_file.return_value = mock_creds
    mock_flow.from_client_secrets_file.return_value.run_local_server.return_value = (
        mock_creds
    )

    events = get_calendar_events()

    assert events == ["event1", "event2"]
    mock_flow.from_client_secrets_file.assert_called_once()
    mock_open.assert_called_once_with(TOKEN_PATH, "w")
    mock_open.return_value.__enter__().write.assert_called_once_with(mock_creds.to_json())

@patch("src.ea_assistant.client.chat.completions.create")
def test_generate_daily_note(mock_create):
    """Test the generate_daily_note function."""
    mock_create.return_value = MagicMock(choices=[MagicMock(message=MagicMock(content="test note"))])
    note = generate_daily_note("test events")
    assert note == "test note"

@patch("builtins.open")
@patch("src.ea_assistant.os.makedirs")
def test_write_daily_note(mock_makedirs, mock_open):
    """Test the write_daily_note function."""
    note_path = write_daily_note("test note")
    mock_makedirs.assert_called_once()
    mock_open.assert_called_once_with(note_path, "w")
    mock_open().__enter__().write.assert_called_once_with("test note")

@patch("builtins.open")
def test_write_log(mock_open):
    """Test the write_log function."""
    write_log("test_path")
    mock_open.assert_called_once_with(LOG_PATH, "a")
    mock_open.return_value.__enter__().write.assert_called_once_with(
        f"- {datetime.now().strftime('%Y-%m-%d %H:%M')} - Created daily note at: test_path\n"
    )

@patch("src.ea_assistant.get_calendar_events")
@patch("src.ea_assistant.format_events")
@patch("src.ea_assistant.generate_daily_note")
@patch("src.ea_assistant.write_daily_note")
@patch("src.ea_assistant.write_log")
def test_main(
    mock_write_log,
    mock_write_daily_note,
    mock_generate_daily_note,
    mock_format_events,
    mock_get_calendar_events,
):
    """Test the main function."""
    from src.ea_assistant import main
    main()
    mock_get_calendar_events.assert_called_once()
    mock_format_events.assert_called_once()
    mock_generate_daily_note.assert_called_once()
    mock_write_daily_note.assert_called_once()
    mock_write_log.assert_called_once() 