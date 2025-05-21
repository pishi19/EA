import pickle

TOKEN_PATH = "/Users/air/ea_assistant/credentials/token_gmail.pkl"

with open(TOKEN_PATH, "rb") as f:
    creds = pickle.load(f)
    print("🔍 Scopes granted to current token:")
    if hasattr(creds, "scopes") and creds.scopes:
        for scope in creds.scopes:
            print(" -", scope)
    else:
        print("⚠️ No scopes found in the token. Re-auth may be required.")
