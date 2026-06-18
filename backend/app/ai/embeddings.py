"""Text embedding via OpenAI (text-embedding-3-small, 1536-dim)."""

from app.ai.client import EMBED_SEMAPHORE, get_client
from app.config import get_settings
from app.models import EMBED_DIM

_BATCH = 100  # OpenAI accepts many inputs per embeddings request


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed `texts`, returning one vector per input with order preserved.

    Empty input → empty list. Validates the returned dimension against the
    DDL-fixed `EMBED_DIM` so a model/column mismatch fails loudly here rather
    than as an opaque insert error.
    """
    if not texts:
        return []

    settings = get_settings()
    client = get_client()
    vectors: list[list[float]] = []

    for start in range(0, len(texts), _BATCH):
        batch = texts[start : start + _BATCH]
        async with EMBED_SEMAPHORE:
            resp = await client.embeddings.create(model=settings.embed_model, input=batch)
        # resp.data preserves input order, but sort by index to be safe.
        for item in sorted(resp.data, key=lambda d: d.index):
            vectors.append(item.embedding)

    if vectors and len(vectors[0]) != EMBED_DIM:
        raise RuntimeError(
            f"Embedding dim {len(vectors[0])} != EMBED_DIM {EMBED_DIM}. "
            f"Model {settings.embed_model} doesn't match the vector column width."
        )
    return vectors


async def embed_text(text: str) -> list[float]:
    """Convenience single-text embedding."""
    return (await embed_texts([text]))[0]
