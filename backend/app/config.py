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
    # Concept dedup uses embeddings only as a BLOCKER (to recall candidates); the
    # MERGE decision is the LLM's (ai.match_concept). Pure cosine-threshold merging
    # is low-precision and false-merges siblings/opposites (e.g. top-down vs
    # bottom-up). Cosine DISTANCE (= 1 - similarity) matches the `cosine_distance`
    # query in services/concepts.py.
    block_distance: float = 0.40  # only neighbours with sim >= 0.60 become candidates
    block_top_k: int = 5  # how many nearest candidates to send to the LLM judge
    # The merge judge must tell apart siblings/opposites, which nano confuses, so
    # it uses the stronger mini rather than confirm_model.
    judge_model: str = "gpt-5.4-mini"


@lru_cache
def get_settings() -> Settings:
    return Settings()
