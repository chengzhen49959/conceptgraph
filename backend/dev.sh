#!/usr/bin/env bash
# One-command local dev: the API (uvicorn) AND the ingestion worker (arq), with the
# worker auto-restarted if it dies.
#
# Why this exists: the worker is a SEPARATE long-running process from the API. When
# it isn't running (closed terminal, laptop sleep, a freeze that gets killed), every
# clip/upload silently piles up as "Queued" — the recurring trap. A bare Procfile
# under honcho/foreman doesn't help: those tear ALL processes down when one exits.
# The worker is the fragile one, so here it gets its own restart loop and the API
# does not. (`./dev.sh` matches the Procfile's two processes; see Procfile.)
#
# Stop everything with Ctrl-C — the trap kills the whole process group.
set -euo pipefail
cd "$(dirname "$0")"

# Kill the entire process group (API + worker loop + their children) on exit, so
# Ctrl-C doesn't strand a uvicorn or arq holding port 8000 / the Redis connection.
trap 'kill 0' EXIT INT TERM

echo "[dev] API → http://127.0.0.1:8000"
uv run uvicorn app.main:app --reload --port 8000 &

# Worker restart loop: if arq exits for any reason, wait briefly and relaunch, so a
# transient crash or an OOM-kill doesn't leave ingestion dead for the whole session.
(
  while true; do
    echo "[dev] starting ingestion worker (arq)…"
    uv run arq app.worker.WorkerSettings || true
    echo "[dev] worker exited — restarting in 2s (Ctrl-C to stop everything)"
    sleep 2
  done
) &

wait
