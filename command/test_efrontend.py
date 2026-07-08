#!/usr/bin/env python3
import subprocess
import sys

def main():
    cmd = [sys.executable, "backend/manage.py", "test", "efrontend", "--verbosity", "2"]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    print(proc.stdout)
    if proc.returncode != 0:
        print(proc.stderr, file=sys.stderr)
    return proc.returncode

if __name__ == '__main__':
    sys.exit(main())
