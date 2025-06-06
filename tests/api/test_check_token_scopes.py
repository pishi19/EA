import pytest
from unittest.mock import patch, MagicMock
import pickle
import importlib

@patch("builtins.open")
@patch("pickle.load")
def test_check_token_scopes_with_scopes(mock_pickle_load, mock_open, capsys):
    """Test the check_token_scopes script when the token has scopes."""
    
    # Mock the credentials object
    mock_creds = MagicMock()
    mock_creds.scopes = ["scope1", "scope2"]
    mock_pickle_load.return_value = mock_creds
    
    # Run the script
    import src.api.check_token_scopes
    importlib.reload(src.api.check_token_scopes)
    
    # Assertions
    captured = capsys.readouterr()
    assert "🔍 Scopes granted to current token:" in captured.out
    assert "- scope1" in captured.out
    assert "- scope2" in captured.out

@patch("builtins.open")
@patch("pickle.load")
def test_check_token_scopes_no_scopes(mock_pickle_load, mock_open, capsys):
    """Test the check_token_scopes script when the token has no scopes."""
    
    # Mock the credentials object
    mock_creds = MagicMock()
    mock_creds.scopes = []
    mock_pickle_load.return_value = mock_creds
    
    # Run the script
    import src.api.check_token_scopes
    importlib.reload(src.api.check_token_scopes)
    
    # Assertions
    captured = capsys.readouterr()
    assert "⚠️ No scopes found in the token. Re-auth may be required." in captured.out 