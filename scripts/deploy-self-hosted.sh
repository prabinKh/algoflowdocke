#!/usr/bin/env bash
# Deploy AlgoFlow / FixItAll on a self-hosted runner after each push to main.
set -euo pipefail

ROOT_DIR="${GITHUB_WORKSPACE:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$ROOT_DIR"

APP_NAME="algoflow"
PID_FILE="$ROOT_DIR/.deploy/app.pid"
LOG_DIR="$ROOT_DIR/.deploy/logs"
mkdir -p "$LOG_DIR" "$(dirname "$PID_FILE")"

echo "=== Deploy started at $(date -u +"%Y-%m-%dT%H:%M:%SZ") ==="
echo "Deploy directory: $ROOT_DIR"

# --- Stop running app ---
stop_app() {
  echo "Stopping existing frontend/backend processes..."

  if [[ -f "$PID_FILE" ]]; then
    OLD_PID="$(cat "$PID_FILE" || true)"
    if [[ -n "${OLD_PID:-}" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
      kill "$OLD_PID" 2>/dev/null || true
      sleep 2
      kill -9 "$OLD_PID" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi

  # Kill both old CJS and new MJS builds to be safe
  pkill -f "dist/server.cjs" 2>/dev/null || true
  pkill -f "dist/server.mjs" 2>/dev/null || true 
  
  pkill -f "manage.py runserver" 2>/dev/null || true
  pkill -f "gunicorn" 2>/dev/null || true
  fuser -k 3000/tcp 2>/dev/null || true
  fuser -k 8001/tcp 2>/dev/null || true
}

# --- Python environment ---
setup_python() {
  echo "Setting up Python environment..."
  PYTHON_BIN="python3"

  if [[ -d "$ROOT_DIR/backend/myenv/bin" ]]; then
    source "$ROOT_DIR/backend/myenv/bin/activate"
    PYTHON_BIN="python"
  elif [[ ! -d "$ROOT_DIR/backend/.venv" ]]; then
    "$PYTHON_BIN" -m venv "$ROOT_DIR/backend/.venv"
    source "$ROOT_DIR/backend/.venv/bin/activate"
    PYTHON_BIN="python"
  else
    source "$ROOT_DIR/backend/.venv/bin/activate"
    PYTHON_BIN="python"
  fi

  "$PYTHON_BIN" -m pip install --upgrade pip
  "$PYTHON_BIN" -m pip install -r "$ROOT_DIR/backend/requirements.txt"
  export PYTHON_BIN
}

# --- Node dependencies & build ---
setup_node() {
  echo "Installing Node dependencies (including devDependencies for build tools)..."
  unset NODE_ENV
  export NPM_CONFIG_PRODUCTION=false

  if [[ -f package-lock.json ]]; then
    npm ci --legacy-peer-deps --include=dev
  else
    npm install --legacy-peer-deps --include=dev
  fi

  echo "Building frontend + production server..."
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"
  echo "Using NODE_OPTIONS=${NODE_OPTIONS}"
  free -h 2>/dev/null || true
  NODE_ENV=production npm run build:prod
}

# --- Django migrations ---
run_migrations() {
  echo "Running Django migrations..."
  cd "$ROOT_DIR/backend"
  "$PYTHON_BIN" manage.py makemigrations --noinput || true
  "$PYTHON_BIN" manage.py migrate --noinput
  "$PYTHON_BIN" manage.py collectstatic --noinput --clear 2>/dev/null || true
  cd "$ROOT_DIR"
}

# --- Start app ---
start_app() {
  echo "Starting production server (frontend + backend proxy)..."
  export NODE_ENV=production
  export PORT="${PORT:-3000}"

  nohup npm run start > "$LOG_DIR/app.log" 2>&1 &
  echo $! > "$PID_FILE"

  echo "Waiting for services to become ready..."
  for i in {1..30}; do
    if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
      echo "Health check passed on port ${PORT}"
      echo "=== Deploy finished successfully ==="
      return 0
    fi
    sleep 2
  done

  echo "Health check failed. Printing FULL logs to help debug:"
  cat "$LOG_DIR/app.log" || true
  exit 1
}

stop_app
setup_python
setup_node
run_migrations
start_app