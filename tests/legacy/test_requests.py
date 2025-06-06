import os
import traceback

import requests

QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
url = f"http://127.0.0.1:{QDRANT_PORT}/collections"

print(f"Attempting GET request to: {url} using Python 'requests' library...")
try:
    response = requests.get(url, timeout=10) # 10-second timeout
    print(f"Status Code: {response.status_code}")
    response.raise_for_status() # Raise an HTTPError for bad responses (4XX or 5XX)
    print("Request successful!")
    print("Response JSON:")
    print(response.json())
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
    print("Traceback:")
    traceback.print_exc()
except Exception as e:
    print(f"An unexpected error occurred: {e}")
    print("Traceback:")
    traceback.print_exc()
