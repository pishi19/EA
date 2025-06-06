from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

from src.cursor_dashboard import CursorDashboard


@pytest.fixture
def dashboard():
    """Return a CursorDashboard instance."""
    return CursorDashboard()

def test_init(dashboard):
    """Test the __init__ method of the CursorDashboard class."""
    assert isinstance(dashboard, CursorDashboard)
    assert dashboard.sessions_dir.name == "sessions"
    assert dashboard.metrics_path.name == "metrics.json"
    assert dashboard.roadmap_path.name == "ea_roadmap.md"
    assert dashboard.email_log_path.name == "EmailLog.md"

def test_load_metrics(dashboard, tmp_path):
    """Test the load_metrics method of the CursorDashboard class."""

    # Create some dummy session files
    session_dir = tmp_path / "sessions"
    date_dir = session_dir / "2023-01-01"
    cursor_dir = date_dir / "cursor"
    cursor_dir.mkdir(parents=True, exist_ok=True)

    # Valid session file
    (cursor_dir / "session1.md").write_text('---\ntopic: test\n---\ncontent')

    # Invalid session file (no frontmatter)
    (cursor_dir / "session2.md").write_text('no frontmatter')

    dashboard.sessions_dir = session_dir

    df = dashboard.load_metrics()

    assert isinstance(df, pd.DataFrame)
    assert len(df) == 1
    assert df.iloc[0]["topic"] == "test"

def test_load_metrics_empty(dashboard, tmp_path):
    """Test the load_metrics method when no session files are found."""
    dashboard.sessions_dir = tmp_path / "sessions"
    df = dashboard.load_metrics()
    assert isinstance(df, pd.DataFrame)
    assert len(df) == 0

@patch("src.cursor_dashboard.st")
def test_display_analytics(mock_st, dashboard):
    """Test the display_analytics method of the CursorDashboard class."""

    # Mock the metrics
    metrics = pd.DataFrame([{"accomplishments": ["test accomplishment"], "files_modified": ["test_file.py"], "other_metric": "test_value"}])
    dashboard.load_metrics = MagicMock(return_value=metrics)

    dashboard.display_analytics()

    # Assertions
    mock_st.subheader.assert_any_call("Accomplishments")
    mock_st.write.assert_any_call("- test accomplishment")
    mock_st.subheader.assert_any_call("Files Modified")
    mock_st.write.assert_any_call("- test_file.py")
    mock_st.subheader.assert_any_call("Other Metrics")

@patch("src.cursor_dashboard.st")
def test_display_analytics_empty(mock_st, dashboard):
    """Test the display_analytics method when no metrics are available."""
    dashboard.load_metrics = MagicMock(return_value=pd.DataFrame())
    dashboard.display_analytics()
    mock_st.warning.assert_called_once_with("No metrics available.")

@patch("src.cursor_dashboard.st")
def test_display_roadmap(mock_st, dashboard, tmp_path):
    """Test the display_roadmap method of the CursorDashboard class."""

    # Create a dummy roadmap file
    roadmap_file = tmp_path / "ea_roadmap.md"
    roadmap_file.write_text("test roadmap")
    dashboard.roadmap_path = roadmap_file

    dashboard.display_roadmap()

    # Assertions
    mock_st.header.assert_called_once_with("Roadmap")
    mock_st.markdown.assert_called_once_with("test roadmap")

@patch("src.cursor_dashboard.st")
def test_display_inbox(mock_st, dashboard):
    """Test the display_inbox method of the CursorDashboard class."""

    # Mock the emails
    emails = [{"subject": "test subject", "sender": "test sender", "date": "2023-01-01", "link": "http://test.com"}]
    dashboard._load_emails = MagicMock(return_value=emails)

    dashboard.display_inbox()

    # Assertions
    mock_st.title.assert_called_once_with("📧 Email Inbox & Flow")
    assert dashboard._load_emails.call_count == 1

@patch("src.cursor_dashboard.st")
def test_display_overall_metrics(mock_st, dashboard):
    """Test the _display_overall_metrics method of the CursorDashboard class."""
    mock_st.columns.return_value = (MagicMock(), MagicMock(), MagicMock())
    df = pd.DataFrame({"error_count": [1], "warning_count": [2], "info_count": [3], "debug_count": [4], "file_size": [1024], "error_rate": [0.1], "warning_rate": [0.2], "growth_rate": [0.3], "component": ["test"]})
    dashboard._display_overall_metrics(df)
    mock_st.subheader.assert_called_once_with("System Overview")
    assert mock_st.metric.call_count == 9

@patch("src.cursor_dashboard.st")
def test_display_component_metrics(mock_st, dashboard):
    """Test the _display_component_metrics method of the CursorDashboard class."""
    mock_st.columns.side_effect = [(MagicMock(), MagicMock(), MagicMock()), (MagicMock(), MagicMock())]
    df = pd.DataFrame({"error_count": [1], "warning_count": [2], "info_count": [3], "debug_count": [4], "file_size": [1024], "error_rate": [0.1], "warning_rate": [0.2], "growth_rate": [0.3], "component": ["test"]})
    dashboard._display_component_metrics(df, ["test"])
    mock_st.subheader.assert_called_once_with("Component Metrics")
    assert mock_st.metric.call_count == 6

def test_load_emails(dashboard, tmp_path):
    """Test the _load_emails method of the CursorDashboard class."""
    email_log_file = tmp_path / "EmailLog.md"
    email_log_file.write_text("### 🔹 [test subject](http://test.com)\n- **From**: test sender\n- **Date**: 2023-01-01")
    dashboard.email_log_path = email_log_file
    emails = dashboard._load_emails()
    assert len(emails) == 1
    assert emails[0]["subject"] == "test subject"

@patch("src.cursor_dashboard.CursorDashboard")
@patch("src.cursor_dashboard.st")
def test_main(mock_st, mock_dashboard):
    """Test the main function of the cursor_dashboard script."""
    from src.cursor_dashboard import main
    main()
    mock_st.set_page_config.assert_called_once()
    mock_dashboard.assert_called()
