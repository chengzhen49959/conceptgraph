"""Worker-liveness signal shared by the API and the arq worker — one place that
knows how "is ingestion alive?" is represented in Redis.

The arq worker writes a health key to Redis every ``WORKER_HEALTH_INTERVAL``
seconds (arq gives it a TTL of interval+1s) and DELETES it on a clean shutdown.
So a hard-killed, frozen, or never-started worker lets the key lapse within the
TTL window — and the API can tell the user "ingestion offline" instead of letting
a clip sit forever as a silent "Queued". We reuse arq's own health key rather than
maintaining a second heartbeat: one fact, one source.
"""

from __future__ import annotations

from typing import Any

from arq.constants import default_queue_name, health_check_key_suffix

# How often the worker refreshes its health key. arq's default is 3600s (useless
# as a liveness probe); 15s means a dead worker reads as offline within ~16s (the
# key's TTL) rather than an hour. The worker wires this into
# ``WorkerSettings.health_check_interval``.
WORKER_HEALTH_INTERVAL = 15

# The exact key arq writes: the (default) queue name + arq's ':health-check'
# suffix. We don't override ``queue_name``, so this matches the worker's key.
WORKER_HEALTH_KEY = f"{default_queue_name}{health_check_key_suffix}"


async def worker_is_online(redis: Any) -> bool:
    """True when the arq worker has refreshed its health key inside the TTL window.

    ``redis`` is the API's arq pool (``app.state.arq``); it is ``None`` when no
    ``REDIS_URL`` is configured — in which case there is no worker to be online.
    """
    if redis is None:
        return False
    return bool(await redis.exists(WORKER_HEALTH_KEY))
