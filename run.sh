#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${BACKEND_DIR:-$PROJECT_ROOT}"
FRONTEND_DIR="${FRONTEND_DIR:-$PROJECT_ROOT}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
LOG_DIR="${LOG_DIR:-$PROJECT_ROOT/logs}"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
FRONTEND_URL="http://$FRONTEND_HOST:$FRONTEND_PORT/"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  trap - INT TERM EXIT
  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup INT TERM EXIT

wait_for_server() {
  local name="$1" url="$2" log_file="$3" attempt
  for attempt in {1..60}; do
    if curl --silent --show-error --max-time 1 "$url" >/dev/null 2>&1; then
      printf '[CA Buddy] %s is reachable at %s\n' "$name" "$url"
      return 0
    fi
    sleep 0.5
  done
  printf '[CA Buddy] ERROR: %s did not become reachable at %s. See %s\n' "$name" "$url" "$log_file" >&2
  return 1
}

detect_backend() {
  BACKEND_COMMAND=()
  BACKEND_ENTRY=""
  if [[ -f "$BACKEND_DIR/manage.py" ]]; then
    BACKEND_ENTRY="manage.py"
    BACKEND_COMMAND=("$PYTHON_BIN" manage.py runserver "$BACKEND_HOST:$BACKEND_PORT")
  elif [[ -f "$BACKEND_DIR/app.py" ]]; then
    BACKEND_ENTRY="app.py"
  elif [[ -f "$BACKEND_DIR/main.py" ]]; then
    BACKEND_ENTRY="main.py"
  else
    return 0
  fi
  if [[ "$BACKEND_ENTRY" == "app.py" || "$BACKEND_ENTRY" == "main.py" ]]; then
    local backend_file="$BACKEND_DIR/$BACKEND_ENTRY"
    if grep -Eq '(^|[[:space:]])(from|import)[[:space:]]+fastapi' "$backend_file"; then
      BACKEND_COMMAND=("$PYTHON_BIN" -m uvicorn "${BACKEND_ENTRY%.py}:app" --host "$BACKEND_HOST" --port "$BACKEND_PORT")
    elif grep -Eq '(^|[[:space:]])(from|import)[[:space:]]+flask' "$backend_file"; then
      BACKEND_COMMAND=("$PYTHON_BIN" -m flask --app "${BACKEND_ENTRY%.py}" run --host "$BACKEND_HOST" --port "$BACKEND_PORT")
    else
      BACKEND_COMMAND=("$PYTHON_BIN" "$BACKEND_ENTRY")
    fi
  fi
}

start_backend() {
  : > "$BACKEND_LOG"
  PYTHON_BIN="${PYTHON_BIN:-python3}"
  detect_backend
  if [[ ${#BACKEND_COMMAND[@]} -eq 0 ]]; then
    printf '[CA Buddy] No backend entry point detected; this is a frontend-only app.\n'
    printf '%s\n' 'No backend entry point detected; backend startup skipped.' >> "$BACKEND_LOG"
    return 0
  fi
  local venv_dir=""
  if [[ -d "$BACKEND_DIR/.venv" ]]; then venv_dir="$BACKEND_DIR/.venv"; elif [[ -d "$BACKEND_DIR/venv" ]]; then venv_dir="$BACKEND_DIR/venv"; fi
  if [[ -n "$venv_dir" && -f "$venv_dir/bin/activate" ]]; then
    source "$venv_dir/bin/activate"
    PYTHON_BIN="python"
    detect_backend
    printf '[CA Buddy] Activated backend virtual environment: %s\n' "$venv_dir"
  fi
  printf '[CA Buddy] Starting backend on port %s...\n' "$BACKEND_PORT"
  (cd "$BACKEND_DIR" && "${BACKEND_COMMAND[@]}") >> "$BACKEND_LOG" 2>&1 &
  BACKEND_PID=$!
  wait_for_server "Backend" "http://$BACKEND_HOST:$BACKEND_PORT/" "$BACKEND_LOG"
}

start_frontend() {
  : > "$FRONTEND_LOG"
  if [[ ! -f "$FRONTEND_DIR/package.json" && ! -f "$FRONTEND_DIR/index.html" ]]; then
    printf '[CA Buddy] ERROR: No frontend entry point found in %s.\n' "$FRONTEND_DIR" >&2
    return 1
  fi
  if [[ -f "$FRONTEND_DIR/package.json" ]]; then
    if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
      printf '[CA Buddy] Installing frontend dependencies...\n'
      (cd "$FRONTEND_DIR" && if [[ -f package-lock.json ]]; then npm ci; else npm install; fi) >> "$FRONTEND_LOG" 2>&1
    fi
    printf '[CA Buddy] Starting frontend on port %s...\n' "$FRONTEND_PORT"
    (cd "$FRONTEND_DIR" && npm run dev -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT") >> "$FRONTEND_LOG" 2>&1 &
  else
    printf '[CA Buddy] Starting static frontend on port %s...\n' "$FRONTEND_PORT"
    (cd "$FRONTEND_DIR" && python3 -m http.server "$FRONTEND_PORT" --bind "$FRONTEND_HOST") >> "$FRONTEND_LOG" 2>&1 &
  fi
  FRONTEND_PID=$!
  wait_for_server "Frontend" "$FRONTEND_URL" "$FRONTEND_LOG"
}

open_browser() {
  printf '[CA Buddy] Opening browser...\n'
  case "${OSTYPE:-}" in
    linux*)
      if command -v google-chrome >/dev/null 2>&1; then google-chrome "$FRONTEND_URL" >/dev/null 2>&1 & return 0; elif command -v google-chrome-stable >/dev/null 2>&1; then google-chrome-stable "$FRONTEND_URL" >/dev/null 2>&1 & return 0; fi ;;
    darwin*)
      if command -v open >/dev/null 2>&1 && open -Ra "Google Chrome" >/dev/null 2>&1; then open -a "Google Chrome" "$FRONTEND_URL" >/dev/null 2>&1 & return 0; fi ;;
    msys*|cygwin*|win32*)
      if command -v start >/dev/null 2>&1; then start chrome "$FRONTEND_URL" >/dev/null 2>&1 & return 0; fi ;;
  esac
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "$FRONTEND_URL" >/dev/null 2>&1 & printf '[CA Buddy] Chrome was not found; opened the system browser at %s\n' "$FRONTEND_URL"; else printf '[CA Buddy] Chrome was not found. Open this URL manually: %s\n' "$FRONTEND_URL"; fi
}

mkdir -p "$LOG_DIR"
start_backend
start_frontend
open_browser
printf '[CA Buddy] App is running at %s\n' "$FRONTEND_URL"
printf '[CA Buddy] Logs: %s and %s\n' "$BACKEND_LOG" "$FRONTEND_LOG"
printf '[CA Buddy] Press Ctrl+C to stop the app.\n'
wait "$FRONTEND_PID"
