#!/usr/bin/env python3
"""Run Django tests per app by scanning `backend/` for app folders.
This avoids importing raw test files placed in `command/` and runs tests
via `manage.py test <app>` with cwd set to `backend/`.
"""
import subprocess
import sys
from pathlib import Path

BACKEND = Path('backend')
if not BACKEND.exists():
    print('backend/ not found; run from repo root')
    sys.exit(1)

# find candidate apps: folders in backend/ that contain models.py
apps = []
for p in sorted(BACKEND.iterdir()):
    if p.is_dir() and (p / 'models.py').exists():
        # skip the project package
        if p.name in ('fixitall_backend', '__pycache__'):
            continue
        apps.append(p.name)

if not apps:
    print('No Django apps found under backend/.')
    sys.exit(1)

results = []
for app in apps:
    print(f'Running tests for app: {app}')
    proc = subprocess.run([sys.executable, str(BACKEND / 'manage.py'), 'test', app, '--verbosity', '2'], capture_output=True, text=True)
    out = proc.stdout
    err = proc.stderr
    ok = proc.returncode == 0
    results.append((app, ok, out, err))
    sep = '=' * 60
    print(sep)
    print(out)
    if not ok:
        print('--- STDERR ---', file=sys.stderr)
        print(err, file=sys.stderr)
    print(sep)

print('\nTest Summary:')
failures = [r for r in results if not r[1]]
for app, ok, out, err in results:
    status = 'OK' if ok else 'FAILED'
    print(f'- {app}: {status}')

if failures:
    print('\nFailures detected:')
    for app, ok, out, err in failures:
        print(f'* {app} failed — showing last 300 chars of stderr:')
        print((err or out)[-300:])
    sys.exit(1)

print('\nAll backend app tests passed.')
sys.exit(0)
