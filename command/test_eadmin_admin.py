#!/usr/bin/env python3
import subprocess
import sys

def main():
    cmd = [sys.executable, "manage.py", "test", "eadmin", "--verbosity", "2"]
    proc = subprocess.run(cmd, capture_output=True, text=True, cwd="backend")
    print(proc.stdout)
    if proc.returncode != 0:
        print(proc.stderr, file=sys.stderr)
    return proc.returncode

if __name__ == '__main__':
    sys.exit(main())
