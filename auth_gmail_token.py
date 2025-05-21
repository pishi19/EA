import os
import pickle
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow

# Config paths
CREDS_PATH = "/Users/air/ea_assistant/credentials_gmail.json"
TOKEN_PATH = "/Users/air/ea_assistant/credentials/token_gmail.pkl"
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

def main():
    flow = InstalledAppFlow.from_client_secrets_file(CREDS_PATH, SCOPES)
    creds = flow.run_local_server(port=0)
    os.makedirs(os.path.dirname(TOKEN_PATH), exist_ok=True)
    with open(TOKEN_PATH, 'wb') as token_file:
        pickle.dump(creds, token_file)
    print(f"✅ Gmail token saved to: {TOKEN_PATH}")

if __name__ == '__main__':
    main()
