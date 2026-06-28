from fastapi import APIRouter, Request

from app.services.worker_health import worker_is_online

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    """Liveness check — no auth required."""
    return {"status": "ok"}


@router.get("/health/worker")
async def worker_health(request: Request) -> dict[str, bool]:
    """Is the ingestion (arq) worker alive?

    Reads the worker's Redis health key (refreshed on a short interval, deleted or
    expired when the worker stops). The dashboard polls this so a clip stuck at
    "Queued" shows its real cause — the worker is down — instead of an endless
    spinner. No auth, same as /health; ``app.state.arq`` is None when Redis is
    unconfigured, which reads as offline.
    """
    return {"online": await worker_is_online(request.app.state.arq)}
