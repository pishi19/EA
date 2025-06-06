import pickle

from src.system.path_config import TOKEN_PATH

with open(TOKEN_PATH, "rb") as f:
    creds = pickle.load(f)
    print("🔍 Scopes granted to current token:")
    if hasattr(creds, "scopes") and creds.scopes:
        for scope in creds.scopes:
            print(" -", scope)
    else:
        print("⚠️ No scopes found in the token. Re-auth may be required.")
