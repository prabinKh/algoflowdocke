
import urllib.request
import subprocess
import sys
import os

url = "https://bootstrap.pypa.io/get-pip.py"
print(f"Downloading {url}...")
urllib.request.urlretrieve(url, "get-pip.py")
print("Running get-pip.py...")
subprocess.run([sys.executable, "get-pip.py", "--user"], check=True)
os.remove("get-pip.py")
