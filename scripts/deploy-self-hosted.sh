if [[ -f package-lock.json ]]; then
    npm ci --legacy-peer-deps --include=dev
  else
    npm install --legacy-peer-deps --include=dev
  fi

  echo "Building frontend + production server..."
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"
  NODE_ENV=production npm run build:prod
}

# --- Django migrations ---
run_migrations() {
  echo "Running Django migrations..."
  cd "$ROOT_DIR/backend"
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
  echo "App started in background. Logs available at $LOG_DIR/app.log"
}

# Cleanup is handled by GitHub Actions workflow
setup_python
run_migrations
setup_node
start_app