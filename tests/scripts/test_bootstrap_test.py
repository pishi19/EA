import pytest
from unittest.mock import patch
from scripts.bootstrap_test import main

@patch("scripts.bootstrap_test.vault_index.generate_vault_index")
@patch("scripts.bootstrap_test.status_writer.write_status")
def test_main(mock_write_status, mock_generate_vault_index):
    """Test the main function of the bootstrap_test script."""
    main()
    mock_generate_vault_index.assert_called_once()
    mock_write_status.assert_called_once_with("bootstrap", action="check") 