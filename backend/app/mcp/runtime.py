"""Process-wide singletons the MCP tools need but can't reach through FastAPI's
dependency injection (tools run outside the request/``Depends`` machinery).

The arq pool is created once in the app lifespan (``app/main.py``) and stashed
here so the write tool can enqueue ingestion jobs on the *same* pool the HTTP
upload routes use.
"""

from __future__ import annotations

from typing import Any

_arq: Any = None


def set_arq(pool: Any) -> None:
    """Record the process arq pool (called from the app lifespan)."""
    global _arq
    _arq = pool


def get_arq() -> Any:
    """The arq pool, or ``None`` if Redis was unavailable at startup."""
    return _arq
