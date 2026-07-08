# Vantage API (FastAPI + LangGraph). Sized for ONE small always-on instance:
# a single uvicorn worker, CPU-only torch, and the embedding model baked in so
# a cold start never waits on a HuggingFace download.
#
# Build:  docker build -t vantage-api ./backend
# Run:    docker run -p 8000:8000 --env-file backend/.env vantage-api
FROM python:3.11-slim AS runtime

# - unbuffered, no-pyc: clean container logs, no stray .pyc writes
# - pip flags: no wheel cache (smaller image), quiet, patient on the big torch download
# - HF_HOME: one fixed spot for the embedding model, shared by build and runtime
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=120 \
    HF_HOME=/opt/hf-cache \
    PORT=8000

# libgomp1 is the one system library the CPU torch wheels need at import time.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Non-root from here on (defense in depth); the app never needs to write to disk.
RUN useradd --create-home --uid 10001 appuser

WORKDIR /app

# Dependencies first so edits to app code reuse the (slow) install layer.
# CPU-only torch keeps the image off the multi-GB CUDA build that a low-cost
# instance can neither use nor afford; fall back to the default index if the
# CPU wheel for this pin is unavailable. Then install everything else from the
# lock with torch already satisfied, so it is never re-resolved to the CUDA one.
COPY requirements.txt ./
RUN pip install torch==2.12.1 --index-url https://download.pytorch.org/whl/cpu \
    || pip install torch==2.12.1
RUN grep -v '^torch==' requirements.txt > /tmp/reqs.txt \
    && pip install -r /tmp/reqs.txt \
    && rm /tmp/reqs.txt

# Bake the creative-mechanism embedding model into the image (app.tools.mechanisms
# loads all-MiniLM-L6-v2 the first time a report retrieves patterns). Downloading
# it here, not on first request, keeps cold starts fast and survives an ephemeral
# filesystem. This is the only build step that reaches the network.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')" \
    && chown -R appuser:appuser "$HF_HOME"

# The model is present, so pin inference to the local cache: no surprise network
# calls, no version checks, faster and cheaper on every run.
ENV HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1

# The runtime package plus the creative knowledge base. graph.py reads
# data/vantage-creative-knowledge-base.json at runtime for the reviewer
# rubric and the creative playbook; without it the reviewer degrades to a
# fallback and concept quality drops. Ship it, always.
COPY --chown=appuser:appuser app ./app
COPY --chown=appuser:appuser data ./data

USER appuser
EXPOSE 8000

# Reuse the app's own /health (main.py); no curl in the slim image, so probe
# with the interpreter that is already here.
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD python -c "import os,urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:'+os.environ.get('PORT','8000')+'/health', timeout=2).status==200 else 1)"

# One worker on purpose. It is the frugal choice for a single small instance,
# and it is also required for correctness: the slowapi rate limiter and the
# graph-concurrency semaphore are per-process, so extra workers would each get
# their own counters and silently multiply the caps. --proxy-headers lets the
# per-IP rate limit see the real client IP behind the platform's proxy.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --proxy-headers --forwarded-allow-ips='*'"]
