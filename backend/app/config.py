from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Backend configuration, loaded from the environment / a local `.env` file."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Required — copy from your Supabase project's Settings → API page.
    supabase_url: str
    # Secret key (sb_secret_... or legacy service_role) — server-side only, bypasses RLS.
    supabase_secret_key: str

    # Browser origin allowed by CORS (the Next.js dev server).
    frontend_origin: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
