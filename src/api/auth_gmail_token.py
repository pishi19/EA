import os
import pickle

from google_auth_oauthlib.flow import InstalledAppFlow

from src.system.path_config import CREDENTIALS, TOKEN_PATH

# Config paths
SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]


def get_credentials():
    """Gets user credentials from a local file."""
    flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS, SCOPES)
    creds = flow.run_local_server(port=0)
    return creds

def main():
    creds = get_credentials()
    os.makedirs(os.path.dirname(TOKEN_PATH), exist_ok=True)
    with open(TOKEN_PATH, "wb") as token_file:
        pickle.dump(creds, token_file)
    print(f"✅ Gmail token saved to: {TOKEN_PATH}")


if __name__ == "__main__":
    main()
