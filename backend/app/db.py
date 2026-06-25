from collections.abc import AsyncIterator
from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings


@lru_cache
def get_engine() -> AsyncEngine:
    """Process-wide async engine for Aurora PostgreSQL (asyncpg driver).

    ``pool_pre_ping`` drops connections Aurora has closed (failovers, idle
    timeouts) instead of handing a dead one to a request.

    Note on pgvector: the SQLAlchemy ``Vector`` column type (app/models.py)
    serializes embeddings over the text protocol, which Postgres casts to
    ``vector`` on the way in and the type parses back to an ndarray on the way
    out. Do NOT also call ``pgvector.asyncpg.register_vector`` here — its binary
    codec expects a Python list and collides with the type's text output
    (``could not convert string to float``). Registration is only for code that
    talks to raw asyncpg, bypassing SQLAlchemy; the whole pipeline goes through
    the ORM / Core, so the type handles it.
    """
    return create_async_engine(
        get_settings().database_url,
        pool_pre_ping=True,
        # Recycle pooled connections before Aurora / the network path silently
        # drops an idle one (otherwise the next use raises `connection_lost` /
        # `Errno 54 Connection reset`). pre_ping catches a dead connection at
        # checkout; recycle keeps them young enough that it rarely has to.
        pool_recycle=300,
        # Sized to cover the merge phase's concurrent concept resolutions
        # (config.merge_concurrency, each briefly checking out a session) across the
        # worker's concurrent jobs (WorkerSettings.max_jobs), with headroom for the
        # API's request sessions. Default 5+10 was tight once merge went concurrent.
        pool_size=10,
        max_overflow=20,
    )


@lru_cache
def _sessionmaker() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(get_engine(), expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency yielding an Aurora session, closed after the request."""
    async with _sessionmaker()() as session:
        yield session
