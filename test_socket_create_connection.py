import socket
import traceback # For more detailed error output if needed

try:
    print("Attempting to connect to 127.0.0.1:6333 with socket.create_connection(timeout=3)...")
    s = socket.create_connection(("127.0.0.1", 6333), timeout=3)
    print("✅ Success: Connected to Qdrant on 127.0.0.1:6333")
    s.close() # Close the socket after successful connection
except socket.timeout:
    print("❌ Connection failed: Timeout")
    print("Traceback:")
    traceback.print_exc()
except socket.error as e: # More specific socket errors
    print(f"❌ Connection failed: Socket error - {e}")
    print("Traceback:")
    traceback.print_exc()
except Exception as e:
    print(f"❌ Connection failed: An unexpected error occurred - {e}")
    print("Traceback:")
    traceback.print_exc() 