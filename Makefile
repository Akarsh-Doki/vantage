# Vantage — one entry point per task. `make check` == scripts/check.sh (the
# single source of truth for green); lint/test are subsets of the same script.

.PHONY: setup dev dev-backend dev-frontend dev-fetcher \
        lint test test-backend test-frontend test-fetcher check

setup:
	./scripts/setup.sh

# --- run -----------------------------------------------------------------
dev:                ## all three services together (Ctrl+C stops all)
	./scripts/dev.sh

dev-backend:
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000

dev-frontend:
	npm --prefix frontend run dev

dev-fetcher:
	cd fetcher && go run .

# --- quality -------------------------------------------------------------
lint:               ## every linter/formatter/type check, all services
	./scripts/check.sh lint

test:               ## every test suite, all services
	./scripts/check.sh test

check:              ## everything — the bar for merging
	./scripts/check.sh

test-backend:
	cd backend && .venv/bin/pytest -q

test-frontend:
	npm --prefix frontend test

test-fetcher:
	cd fetcher && go test ./...
