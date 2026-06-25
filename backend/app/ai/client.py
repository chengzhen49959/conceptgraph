"""Shared OpenAI client for the ingestion pipeline.

Centralizes the async client, model selection (via config), and concurrency
limits so a single big document's per-chunk fan-out doesn't trigger 429s. All
OpenAI usage in the backend goes through app/ai — nothing calls the SDK directly.
"""

import asyncio
from functools import lru_cache

from openai import AsyncOpenAI

from app.config import get_settings

# Bound concurrent OpenAI calls. A 200-chunk PDF would otherwise launch 200
# extraction calls at once. The SDK retries 429s on top of this.
LLM_SEMAPHORE = asyncio.Semaphore(5)
EMBED_SEMAPHORE = asyncio.Semaphore(5)


@lru_cache
def get_client() -> AsyncOpenAI:
    """Process-wide async OpenAI client. Raises if the key isn't configured."""
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not set — required for the ingestion pipeline. "
            "Add it to backend/.env.local."
        )
    # Explicit per-request timeout. Without it the SDK default is 600s — equal to
    # the worker's job_timeout, so a single stalled call (common on a flaky
    # VPN/GFW link) silently eats the entire job budget and the doc freezes
    # mid-pipeline. 45s × up-to-5 attempts (max_retries=4) stays well under 600s,
    # so a stuck call fails fast and surfaces as a real error instead of a hang.
    return AsyncOpenAI(
        api_key=settings.openai_api_key, max_retries=4, timeout=45.0
    )
