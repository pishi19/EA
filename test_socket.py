import socket
import os
import traceback

QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
host = "127.0.0.1"
port = QDRANT_PORT

print(f"Attempting to open a raw TCP socket to {host}:{port}...")
try:
    # Create a socket object
    # AF_INET specifies the address family (IPv4)
    # SOCK_STREAM specifies the socket type (TCP)
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(5) # Set a timeout for the connection attempt (5 seconds)
        print(f"Connecting to {host} on port {port}...")
        s.connect((host, port))
        print("Socket connection successful!")
        # If connection is successful, you could try sending a basic HTTP GET request
        # For now, just establishing the connection is the main test.
        # http_request = b"GET /collections HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n"
        # s.sendall(http_request)
        # response = b""
        # while True:
        #     data = s.recv(1024)
        #     if not data:
        #         break
        #     response += data
        # print("Received response (first 500 bytes):")
        # print(response[:500].decode(errors='ignore'))

except socket.timeout:
    print("Connection attempt timed out.")
    print("Traceback:")
    traceback.print_exc()
except socket.error as e:
    print(f"Socket connection failed: {e}")
    print("Traceback:")
    traceback.print_exc()
except Exception as e:
    print(f"An unexpected error occurred: {e}")
    print("Traceback:")
    traceback.print_exc() 