"""S3 object storage — presigned PUT for the browser, get_object for the worker.

boto3 is synchronous, so the public helpers wrap it in ``asyncio.to_thread`` to
stay non-blocking. Fewer deps than aioboto3 for the handful of calls we make.
"""

import asyncio
import logging
from functools import lru_cache

import boto3

from app.config import get_settings

_PRESIGN_TTL = 900  # seconds the upload URL stays valid


@lru_cache
def _client():
    settings = get_settings()
    if not settings.s3_bucket:
        raise RuntimeError(
            "S3_BUCKET is not set — required for document upload. "
            "Add it to backend/.env.local."
        )
    kwargs: dict = {"region_name": settings.aws_region}
    # Explicit creds are optional; without them boto3 uses its default chain
    # (env vars, shared config, or the instance role on Render).
    if settings.aws_access_key_id and settings.aws_secret_access_key:
        kwargs["aws_access_key_id"] = settings.aws_access_key_id
        kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
    return boto3.client("s3", **kwargs)


def _presign_put(key: str, content_type: str) -> str:
    settings = get_settings()
    return _client().generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.s3_bucket, "Key": key, "ContentType": content_type},
        ExpiresIn=_PRESIGN_TTL,
    )


def _get(key: str) -> bytes:
    settings = get_settings()
    obj = _client().get_object(Bucket=settings.s3_bucket, Key=key)
    return obj["Body"].read()


def _delete(keys: list[str]) -> None:
    settings = get_settings()
    _client().delete_objects(
        Bucket=settings.s3_bucket,
        Delete={"Objects": [{"Key": k} for k in keys], "Quiet": True},
    )


async def presign_put_url(key: str, content_type: str) -> str:
    """A presigned PUT URL the browser uploads raw bytes to directly."""
    return await asyncio.to_thread(_presign_put, key, content_type)


async def get_object(key: str) -> bytes:
    """Fetch an uploaded object's bytes (for the worker to parse)."""
    return await asyncio.to_thread(_get, key)


async def delete_objects(keys: list[str]) -> None:
    """Best-effort removal of uploaded objects whose documents were deleted.

    A leftover blob is harmless (only storage cost), so any failure is logged and
    swallowed — it must never undo the DB delete that already committed. Empty
    input is a no-op so callers needn't special-case "nothing to clean".
    """
    keys = [k for k in keys if k]
    if not keys:
        return
    try:
        await asyncio.to_thread(_delete, keys)
    except Exception:
        logging.getLogger("storage").warning(
            "failed to delete %d S3 object(s); leaving them orphaned",
            len(keys),
            exc_info=True,
        )
