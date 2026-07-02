#!/usr/bin/env bash
# The single source of truth for "is everything green".
#
#   scripts/check.sh          run all linters and all tests
#   scripts/check.sh lint     linters/formatters/type checks only
#   scripts/check.sh test     test suites only
#
# make check / make lint / make test call this script. Runs everything even if
# an early step fails, then reports a summary and exits non-zero on any failure.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-all}"
case "$MODE" in all|lint|test) ;; *) echo "Usage: $0 [lint|test|all]" >&2; exit 2 ;; esac

FAILURES=()

# run <label> <command...> — records failure instead of aborting the whole run
run() {
  local label="$1"; shift
  echo
  echo "==> $label"
  if "$@"; then
    echo "    OK: $label"
  else
    echo "    FAIL: $label" >&2
    FAILURES+=("$label")
  fi
}

want_lint() { [ "$MODE" = "all" ] || [ "$MODE" = "lint" ]; }
want_test() { [ "$MODE" = "all" ] || [ "$MODE" = "test" ]; }

# --- backend ------------------------------------------------------------------
PY="$ROOT/backend/.venv/bin"
if [ ! -x "$PY/python" ]; then
  echo "Backend virtualenv is missing — run scripts/setup.sh first." >&2
  exit 1
fi

# black/mypy need source files to exist; ruff and pytest handle "none yet".
backend_has_py=0
if find "$ROOT/backend" -name '*.py' -not -path '*/.venv/*' | grep -q .; then
  backend_has_py=1
fi

if want_lint; then
  run "backend: ruff lint" "$PY/ruff" check "$ROOT/backend"
  if [ "$backend_has_py" -eq 1 ]; then
    run "backend: black --check" "$PY/black" --check --quiet "$ROOT/backend"
    run "backend: mypy (strict)" sh -c "cd '$ROOT/backend' && '$PY/mypy' ."
  else
    echo
    echo "==> backend: no Python source yet — skipping black and mypy."
  fi
fi

if want_test; then
  # pytest exit code 5 means "no tests collected" — tolerated only until the
  # first test lands (CLAUDE.md rule 9 makes tests mandatory with logic).
  backend_pytest() {
    (cd "$ROOT/backend" && "$PY/pytest" -q)
    local code=$?
    if [ "$code" -eq 5 ]; then
      echo "    NOTE: no backend tests collected yet."
      return 0
    fi
    return "$code"
  }
  run "backend: pytest" backend_pytest
fi

# --- frontend -----------------------------------------------------------------
if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "Frontend dependencies are missing — run scripts/setup.sh first." >&2
  exit 1
fi

if want_lint; then
  run "frontend: eslint"         npm --prefix "$ROOT/frontend" run lint
  run "frontend: prettier check" npm --prefix "$ROOT/frontend" run format:check
  run "frontend: type check"     sh -c "cd '$ROOT/frontend' && npx tsc -b"
fi

if want_test; then
  if node -e "process.exit(require('$ROOT/frontend/package.json').scripts.test ? 0 : 1)"; then
    run "frontend: tests" npm --prefix "$ROOT/frontend" test
  else
    echo
    echo "==> frontend: no test script defined yet — add one when the first component test lands."
  fi
fi

# --- fetcher ------------------------------------------------------------------
if ls "$ROOT/fetcher"/*.go >/dev/null 2>&1; then
  if want_lint; then
    fetcher_fmt() {
      local unformatted
      unformatted="$(gofmt -l "$ROOT/fetcher")"
      if [ -n "$unformatted" ]; then
        echo "    gofmt needed on:" >&2
        echo "$unformatted" >&2
        return 1
      fi
    }
    run "fetcher: gofmt"  fetcher_fmt
    run "fetcher: go vet" sh -c "cd '$ROOT/fetcher' && go vet ./..."
  fi
  if want_test; then
    run "fetcher: go test" sh -c "cd '$ROOT/fetcher' && go test ./..."
  fi
else
  echo
  echo "==> fetcher: no Go source files yet — skipping lint and tests."
fi

# --- summary -------------------------------------------------------------------
echo
if [ "${#FAILURES[@]}" -eq 0 ]; then
  echo "ALL CHECKS GREEN ($MODE)."
else
  echo "FAILED CHECKS (${#FAILURES[@]}):" >&2
  for f in "${FAILURES[@]}"; do echo "  - $f" >&2; done
  exit 1
fi
