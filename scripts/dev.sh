#!/usr/bin/env bash
# Start the FastAPI backend (:8000), Vite frontend (:5173), and Go fetcher
# (:8090) together. Ctrl+C shuts all of them down cleanly.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# --- preflight: catch missing setup with a friendly message -------------------
missing=0
if [ ! -d "$ROOT/backend/.venv" ]; then
  echo "Backend virtualenv (backend/.venv) is missing." >&2
  missing=1
fi
if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "Frontend dependencies (frontend/node_modules) are missing." >&2
  missing=1
fi
if [ ! -f "$ROOT/backend/.env" ] || [ ! -f "$ROOT/frontend/.env.local" ]; then
  echo "Env files are missing (backend/.env and/or frontend/.env.local)." >&2
  missing=1
fi
if [ "$missing" -ne 0 ]; then
  echo >&2
  echo "Looks like the project isn't set up yet. Run:  scripts/setup.sh" >&2
  exit 1
fi

# --- start services, tracked so we can stop them together ---------------------
PIDS=()

cleanup() {
  trap - INT TERM EXIT
  echo
  echo "==> Shutting down all services"
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  echo "==> All services stopped."
}
trap cleanup INT TERM EXIT

echo "==> Starting backend (FastAPI) on http://localhost:8000"
if [ -d "$ROOT/backend/app" ]; then
  (cd "$ROOT/backend" && exec .venv/bin/uvicorn app.main:app --reload --port 8000) &
  PIDS+=($!)
else
  echo "    backend/app not found — backend not scaffolded yet, skipping it." >&2
fi

echo "==> Starting fetcher (Go) on http://localhost:8090"
if ls "$ROOT/fetcher"/*.go >/dev/null 2>&1; then
  (cd "$ROOT/fetcher" && exec go run .) &
  PIDS+=($!)
else
  echo "    fetcher/*.go not found — fetcher not scaffolded yet, skipping it." >&2
fi

echo "==> Starting frontend (Vite) on http://localhost:5173"
(cd "$ROOT/frontend" && exec npm run dev) &
PIDS+=($!)

if [ "${#PIDS[@]}" -eq 0 ]; then
  echo "ERROR: nothing to start." >&2
  exit 1
fi

echo
echo "==> All services started. Press Ctrl+C to stop everything."
wait
