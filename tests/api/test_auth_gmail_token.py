import pytest
from unittest.mock import patch, MagicMock
from src.api.auth_gmail_token import main, get_credentials
import os

@pytest.fixture
def temp_credentials_file(tmp_path):
    """Create a dummy credentials file."""
    creds_dir = tmp_path / "runtime" / "credentials"
    creds_dir.mkdir(parents=True, exist_ok=True)
    creds_file = creds_dir / "credentials_gmail.json"
    creds_file.write_text('{"installed":{"client_id":"test_client_id","project_id":"test_project_id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":"test_client_secret","redirect_uris":["http://localhost"]}}')
    return creds_file

@patch("src.api.auth_gmail_token.InstalledAppFlow")
def test_get_credentials(mock_flow, temp_credentials_file, monkeypatch):
    """Test the get_credentials function."""
    # Mock the InstalledAppFlow
    mock_creds = MagicMock()
    mock_flow_instance = MagicMock()
    mock_flow_instance.run_local_server.return_value = mock_creds
    mock_flow.from_client_secrets_file.return_value = mock_flow_instance

    # Mock the paths
    monkeypatch.setattr("src.api.auth_gmail_token.CREDENTIALS", temp_credentials_file)

    creds = get_credentials()
    
    # Assertions
    mock_flow.from_client_secrets_file.assert_called_once_with(temp_credentials_file, ["https://www.googleapis.com/auth/gmail.modify"])
    mock_flow_instance.run_local_server.assert_called_once_with(port=0)
    assert creds == mock_creds

@patch("src.api.auth_gmail_token.get_credentials")
@patch("src.api.auth_gmail_token.pickle")
@patch("src.api.auth_gmail_token.os.makedirs")
def test_main(mock_makedirs, mock_pickle, mock_get_credentials, temp_credentials_file, monkeypatch, capsys):
    """Test the main function of the auth_gmail_token script."""
    
    # Mock get_credentials
    mock_creds = MagicMock()
    mock_get_credentials.return_value = mock_creds

    # Mock the paths
    token_path = temp_credentials_file.parent / "token_gmail.pkl"
    monkeypatch.setattr("src.api.auth_gmail_token.TOKEN_PATH", token_path)

    # Mock open
    with patch("builtins.open", new_callable=MagicMock()) as mock_open:
        main()
    
    # Assertions
    mock_get_credentials.assert_called_once()
    mock_makedirs.assert_called_once_with(os.path.dirname(token_path), exist_ok=True)
    mock_open.assert_called_once_with(token_path, "wb")
    mock_pickle.dump.assert_called_once_with(mock_creds, mock_open().__enter__())
    
    captured = capsys.readouterr()
    assert f"✅ Gmail token saved to: {token_path}" in captured.out 