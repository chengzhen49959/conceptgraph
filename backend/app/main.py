import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import get_engine
from app.routers import (
    activity,
    annotations,
    ask,
    clusters,
    concepts,
    documents,
    graph,
    graph_edit,
    health,
    imports,
    invites,
    me,
    search,
    workspaces,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fail fast if auth/data aren't configured.
    settings = get_settings()
    assert settings.cognito_user_pool_id and settings.cognito_app_client_id, (
        "Cognito not configured — copy backend/.env.example to backend/.env.local "
        "and fill in your User Pool ID and App Client ID."
    )
    assert settings.database_url, (
        "Aurora not configured — set DATABASE_URL in backend/.env.local."
    )

    # arq pool for enqueuing ingestion jobs. Optional: if REDIS_URL is unset or
    # Redis is unreachable, the app still serves health/me/reads — only uploads
    # (which enqueue) return 503.
    app.state.arq = None
    if settings.redis_url:
        try:
            from arq import create_pool
            from arq.connections import RedisSettings

            app.state.arq = await create_pool(RedisSettings.from_dsn(settings.redis_url))
        except Exception:
            logging.getLogger("startup").warning(
                "arq pool unavailable; document upload disabled", exc_info=True
            )

    yield

    # Release the arq pool and Aurora connection pool on shutdown.
    if app.state.arq is not None:
        await app.state.arq.close()
    await get_engine().dispose()


app = FastAPI(title="Concept Graph API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(me.router)
app.include_router(workspaces.router)
app.include_router(invites.router)
app.include_router(documents.router)
app.include_router(imports.router)
app.include_router(graph.router)
app.include_router(graph_edit.router)
app.include_router(annotations.router)
app.include_router(activity.router)
app.include_router(concepts.router)
app.include_router(clusters.router)
app.include_router(search.router)
app.include_router(ask.router)
