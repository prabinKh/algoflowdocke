#!/bin/sh
# =====================================================================
# entrypoint.sh
# This file was EMPTY in the original repo (0 bytes) â€” that's a bug.
# The Dockerfile's CMD ["./entrypoint.sh"] would do nothing and the
# container would exit immediately. This fills it in.
#
# WHAT IT DOES, IN ORDER:
#   1. Waits for Postgres to accept connections (avoids the classic
#      "django.db.utils.OperationalError: could not connect" crash
#      that happens when the app container starts faster than the
#      database container).
#   2. Runs Django migrations - safe to run every restart, only
#      applies new/pending migrations.
#   3. Collects static files into backend/staticfiles/ so nginx can
#      serve /static/ directly from disk (django-admin CSS/JS, etc).
#   4. Starts the bundled Node server (dist/server.mjs), which in turn
#      spawns gunicorn on :8001 via run_backend.ts - exactly like your
#      existing server.ts already does.
# =====================================================================
set -e

echo "[entrypoint] Waiting for database..."
if [ -n "$DATABASE_URL" ]; then
  python3 - <<'PYEOF'
import os, sys, time
import urllib.parse as up

url = os.getenv("DATABASE_URL", "")
if url.startswith("postgres"):
    import psycopg2
    parsed = up.urlparse(url)
    for attempt in range(30):
        try:
            conn = psycopg2.connect(
                dbname=parsed.path.lstrip("/"),
                user=parsed.username,
                password=parsed.password,
                host=parsed.hostname,
                port=parsed.port or 5432,
            )
            conn.close()
            print("[entrypoint] Database is ready.")
            sys.exit(0)
        except Exception as e:
            print(f"[entrypoint] DB not ready yet ({attempt+1}/30): {e}")
            time.sleep(2)
    print("[entrypoint] Database never became ready, continuing anyway.")
else:
    print("[entrypoint] Using SQLite, no wait needed.")
PYEOF
fi

cd /app/backend

echo "[entrypoint] Running migrations..."
python3 manage.py migrate --noinput

echo "[entrypoint] Collecting static files..."
python3 manage.py collectstatic --noinput --clear

cd /app

echo "[entrypoint] Starting application (Node + Django)..."
exec node dist/server.mjs
