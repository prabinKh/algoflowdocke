#!/bin/sh
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
