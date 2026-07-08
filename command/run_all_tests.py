#!/usr/bin/env python3
"""Master test runner: executes all per-app test scripts in `command/`.
Prints a concise summary and shows failing app outputs.
"""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCRIPTS = [p for p in sorted(HERE.glob('**/test*.py'))]
# detect if there are detailed eadmin scripts (test_eadmin_*.py)
HAS_DETAILED_EADMIN = any(p.stem.startswith('test_eadmin_') for p in SCRIPTS)

if not SCRIPTS:
    print('No test scripts found in command/.')
    sys.exit(1)

results = []
seen_apps = set()

for script in SCRIPTS:
    # If the script looks like a raw test file (imports DRF/Django test classes),
    # try to locate the original test module under `backend/` and run via
    # `manage.py test <app>.<module>` so Django settings are available.
    text = ''
    try:
        text = script.read_text(encoding='utf-8')
    except Exception:
        text = ''

    is_raw_test = False
    if any(x in text for x in ('from rest_framework.test', 'import unittest', 'APITestCase', 'TestCase')):
        is_raw_test = True

    if is_raw_test and not str(script).startswith(str(HERE)):
        is_raw_test = False

    if is_raw_test:
        # look for a matching filename under backend/*
        match = None
        for app_dir in sorted(Path('backend').glob('*')):
            if not app_dir.is_dir():
                continue
            candidate = app_dir / script.name
            if candidate.exists():
                match = (app_dir.name, candidate)
                break

        if match:
            app_key = match[0]
            if app_key in seen_apps:
                print(f"Skipping {script.name} — app '{app_key}' already tested")
                continue
            seen_apps.add(app_key)
            module_label = f"{match[0]}.{script.stem}"
            print(f"Running Django tests for backend module: {module_label} (mapped from {script.name})")
            proc = subprocess.run([sys.executable, 'manage.py', 'test', module_label, '--verbosity', '2'], capture_output=True, text=True, cwd=str(Path('backend')))
        else:
            print(f"Skipping raw test file {script.name} — no backend match found")
            continue
    else:
        # detect and skip generic eadmin when detailed scripts exist
        if HAS_DETAILED_EADMIN and script.name == 'test_eadmin.py':
            print('Skipping generic test_eadmin.py because detailed eadmin scripts exist')
            continue

        # derive an app key from the script name; supports names like
        # test_eadmin.py, test_eadmin_admin.py -> app 'eadmin'
        parts = script.stem.split('_')
        if len(parts) >= 2:
            app_key = parts[1]
        else:
            app_key = script.stem.replace('test_', '')

        if app_key in seen_apps:
            print(f"Skipping {script.name} — app '{app_key}' already tested")
            continue

        seen_apps.add(app_key)
        app_name = app_key
        print(f"Running tests for app: {app_name} (script: {script.name})")
        proc = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
    out = proc.stdout
    err = proc.stderr
    ok = proc.returncode == 0
    results.append((app_name, ok, out, err))
    header = '=' * 60
    print(header)
    print(out)
    if not ok:
        print('--- STDERR ---', file=sys.stderr)
        print(err, file=sys.stderr)
    print(header)

# Summary
print('\nTest Summary:')
failures = [r for r in results if not r[1]]
for app, ok, out, err in results:
    status = 'OK' if ok else 'FAILED'
    print(f"- {app}: {status}")

if failures:
    print('\nFailures detected:')
    for app, ok, out, err in failures:
        print(f"* {app} failed — showing last 200 chars of stderr:")
        tail = (err or out)[-200:]
        print(tail)
    sys.exit(1)

print('\nAll app tests passed.')
sys.exit(0)
