#!/usr/bin/env bash
# One-time (and idempotent) developer setup: installs all dependencies and
# creates local env files from their .env.example templates.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

fail() { echo "ERROR: $*" >&2; exit 1; }

# --- prerequisites -----------------------------------------------------------
command -v python3 >/dev/null 2>&1 || fail "python3 not found. Install Python 3.11+ and re-run."
command -v npm     >/dev/null 2>&1 || fail "npm not found. Install Node.js 20+ and re-run."
command -v go      >/dev/null 2>&1 || fail "go not found. Install Go 1.22+ and re-run."

# --- env files (never overwrite an existing one) -----------------------------
copy_env() {
  local example="$1" target="$2"
  if [ ! -f "$example" ]; then
    echo "WARNING: $example is missing — skipped (add it, it is the template for $target)." >&2
    return 0
  fi
  if [ -f "$target" ]; then
    echo "  $target already exists — leaving it untouched."
  else
    cp "$example" "$target"
    echo "  Created $target from $(basename "$example") — fill in the empty values."
  fi
}

echo "==> Creating env files where missing"
copy_env "$ROOT/backend/.env.example"  "$ROOT/backend/.env"
copy_env "$ROOT/frontend/.env.example" "$ROOT/frontend/.env.local"
copy_env "$ROOT/fetcher/.env.example"  "$ROOT/fetcher/.env"

# --- backend ------------------------------------------------------------------
echo "==> Backend: Python venv + dependencies"
if [ ! -d "$ROOT/backend/.venv" ]; then
  echo "  Creating virtualenv at backend/.venv"
  python3 -m venv "$ROOT/backend/.venv"
fi
"$ROOT/backend/.venv/bin/pip" install --quiet --upgrade pip
"$ROOT/backend/.venv/bin/pip" install --quiet -r "$ROOT/backend/requirements.txt"
echo "  Backend dependencies installed."

# --- frontend -----------------------------------------------------------------
echo "==> Frontend: npm install"
(cd "$ROOT/frontend" && npm install --no-fund --no-audit)
echo "  Frontend dependencies installed."

# --- fetcher ------------------------------------------------------------------
echo "==> Fetcher: go mod tidy"
(cd "$ROOT/fetcher" && go mod tidy)
echo "  Fetcher modules tidy."

echo
echo "Setup complete. Fill in the empty values in backend/.env, frontend/.env.local,"
echo "and fetcher/.env, then run scripts/dev.sh to start everything."
