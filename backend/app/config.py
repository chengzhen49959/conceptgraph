from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Backend configuration, loaded from the environment / a local `.env` file."""

    model_config = SettingsConfigDict(env_file=".env.local", extra="ignore")

    # --- Auth & data (required) ------------------------------------------------
    # Cognito — from the User Pool's "App integration" page. Used to verify the
    # JWT the frontend forwards; no AWS credentials needed for verification.
    cognito_region: str
    cognito_user_pool_id: str
    cognito_app_client_id: str

    # Aurora PostgreSQL — async SQLAlchemy URL, e.g.
    # postgresql+asyncpg://user:pass@cluster-host:5432/dbname
    database_url: str

    # Browser origin allowed by CORS (the Next.js dev server).
    frontend_origin: str = "http://localhost:3000"

    # --- Pipeline runtime credentials -----------------------------------------
    # Defaulted to "" so importing config never fails when these aren't set yet
    # (migrations and the pgvector smoke test only need DATABASE_URL). The code
    # paths that actually use them (AI adapter, worker, S3) fail loudly if blank.
    openai_api_key: str = ""
    redis_url: str = ""  # arq queue + per-workspace merge lock
    s3_bucket: str = ""  # raw document object storage
    aws_region: str = "us-east-1"
    # Optional explicit creds; if blank, boto3 uses its default credential chain
    # (env vars, shared config, or the Render instance role).
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    # --- Model ids (pinned in config so a rename is a one-line change) ----------
    # Verify availability at deploy time; the openai-sdk skill documents the
    # gpt-5.4 family (knowledge cutoff 2025-08-31).
    embed_model: str = "text-embedding-3-small"
    # Extraction quality matters (nano over-extracts sentence fragments / single
    # words as "concepts"), so use the stronger mini for it.
    extract_model: str = "gpt-5.4-mini"  # per-chunk concept/relation extraction
    confirm_model: str = "gpt-5.4-nano"  # merge same-concept confirmation
    label_model: str = "gpt-5.4-mini"  # cluster labelling (low volume, quality)

    # --- Pipeline tuning -------------------------------------------------------
    # NOTE: the embedding dimension is a DDL-fixed constant (the vector column
    # width), not a runtime setting — see EMBED_DIM in app/models.py.
    #
    # Three-band concept dedup, expressed in cosine DISTANCE (= 1 - similarity)
    # to match the `cosine_distance` query in services/concepts.py:
    #   dist <= merge_distance_auto                   -> same concept, merge, no LLM
    #   merge_distance_auto < dist <= review_distance -> ask the LLM judge to decide
    #   dist > review_distance                        -> a new concept
    # Tune merge_distance_auto down if false auto-merges; review_distance up to
    # send more borderline pairs to the judge.
    merge_distance_auto: float = 0.12  # similarity >= 0.88
    review_distance: float = 0.40  # similarity >= 0.60


@lru_cache
def get_settings() -> Settings:
    return Settings()
