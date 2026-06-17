from functools import lru_cache

from supabase import Client, create_client

from app.config import get_settings


@lru_cache
def get_supabase() -> Client:
    """Shared Supabase client built with the project's SECRET key.

    The secret key (``sb_secret_...``, or the legacy service_role key) is
    privileged and server-side only — it bypasses Row Level Security, so it must
    never reach the frontend. Used to validate user tokens via
    ``auth.get_user(token)`` and for any privileged server work you add later.
    """
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_secret_key)
