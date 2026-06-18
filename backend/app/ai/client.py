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
    return AsyncOpenAI(api_key=settings.openai_api_key, max_retries=4)
