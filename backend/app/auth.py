from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.supabase_client import get_supabase

bearer_scheme = HTTPBearer(auto_error=True)


@dataclass
class CurrentUser:
    """The authenticated Supabase user behind a request."""

    id: str
    email: str | None
    token: str  # raw access token — forward to Supabase for RLS-scoped queries


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CurrentUser:
    """Validate the bearer token with Supabase and return the user.

    Works with any Supabase signing scheme (legacy HS256 or the newer asymmetric
    keys) because Supabase itself verifies the token — the backend never needs the
    JWT secret. The trade-off is one network call to Supabase per request.
    """
    token = credentials.credentials
    try:
        response = get_supabase().auth.get_user(token)
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    user = getattr(response, "user", None)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    return CurrentUser(id=user.id, email=user.email, token=token)
