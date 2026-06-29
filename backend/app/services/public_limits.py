"""Abuse ceilings for the public demo graph.

The demo runs real OpenAI extraction + RAG on anonymous input, so every lever
that spends money is capped here. Counters live in Redis (the arq pool the API
already holds) as fixed windows: ``INCR`` the key, set its TTL on the first hit,
compare to the limit. Limits are read from config so demo spend is tunable
without code changes. Each ``enforce_*`` raises 429/503 on breach; the caller
runs them before doing any expensive work.

Redis-absent degradation: if the arq pool is unavailable, rate checks no-op
(``redis is None``). Uploads already fail their own 503 in that state (the
ingest queue is down), and reads/asks being briefly un-throttled during a Redis
outage is an acceptable trade for keeping the demo readable.
"""

from __future__ import annotations

from fastapi import HTTPException, Request, status

from app.config import get_settings

_DAY = 86_400


def client_ip(request: Request) -> str:
    """The caller's IP for per-IP limits. Behind Render's proxy the real client is
    the first hop of ``X-Forwarded-For``; fall back to the socket peer locally."""
    fwd = request.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def _hit(redis, key: str, limit: int, window: int) -> bool:
    """Count one event in a fixed window; True while at or under ``limit``."""
    n = await redis.incr(key)
    if n == 1:
        await redis.expire(key, window)
    return n <= limit


def _too_many(detail: str) -> HTTPException:
    return HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, detail)


async def enforce_session_create(redis, ip: str) -> None:
    """Cap how many demo workspaces one IP may mint per day."""
    if redis is None:
        return
    s = get_settings()
    if not await _hit(redis, f"pub:sess:ip:{ip}", s.public_max_sessions_per_ip_day, _DAY):
        raise _too_many(
            "Too many demo sessions from your network today — please sign in to continue."
        )


async def enforce_upload(redis, *, ip: str, current_doc_count: int) -> None:
    """Gate a demo upload against the per-session, per-IP, and global daily caps.

    ``current_doc_count`` is the visitor's existing document count (counted from
    their workspace, so it's exact and survives a lost session token). The per-IP
    and global counters are Redis fixed windows that bound total demo ingest spend.
    """
    s = get_settings()
    if current_doc_count >= s.public_max_docs_per_session:
        raise _too_many(
            f"Demo limit reached ({s.public_max_docs_per_session} documents). "
            "Sign in to upload more."
        )
    if redis is None:
        return
    if not await _hit(redis, "pub:up:global", s.public_max_uploads_global_day, _DAY):
        # Global kill-switch tripped — surface as "temporarily unavailable", not a
        # per-user limit, since it's not the caller's fault.
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "The demo is at capacity right now — please try again later or sign in.",
        )
    if not await _hit(redis, f"pub:up:ip:{ip}", s.public_max_docs_per_ip_day, _DAY):
        raise _too_many(
            "Too many demo uploads from your network today — please sign in to continue."
        )


async def enforce_ask(redis, token: str) -> None:
    """Per-session rate limit on RAG questions (per-minute and per-hour)."""
    if redis is None:
        return
    s = get_settings()
    if not await _hit(redis, f"pub:ask:min:{token}", s.public_ask_per_min, 60):
        raise _too_many("You're asking very quickly — wait a moment and try again.")
    if not await _hit(redis, f"pub:ask:hr:{token}", s.public_ask_per_hour, 3600):
        raise _too_many("Hourly demo question limit reached — sign in to keep going.")


async def enforce_search(redis, token: str) -> None:
    """Per-session rate limit on semantic search."""
    if redis is None:
        return
    s = get_settings()
    if not await _hit(redis, f"pub:search:min:{token}", s.public_search_per_min, 60):
        raise _too_many("You're searching very quickly — wait a moment and try again.")
