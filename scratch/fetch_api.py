import http.client
import json

def fetch_api(path):
    conn = http.client.HTTPConnection("localhost", 3000)
    conn.request("GET", path)
    r1 = conn.getresponse()
    print(f"Status: {r1.status} {r1.reason}")
    data = r1.read()
    print(f"Body: {data.decode()}")
    conn.close()

print("--- Categories ---")
fetch_api("/api/store/categories/")

print("\n--- Products ---")
fetch_api("/api/store/products/")
