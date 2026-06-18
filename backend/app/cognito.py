from functools import lru_cache
from typing import Any

import jwt
from jwt import PyJWKClient

from app.config import get_settings


@lru_cache
def _jwks_client() -> PyJWKClient:
    """Cached client for the User Pool's public signing keys (JWKS).

    The keys are fetched once and reused, so verifying a token is a local
    signature check — no network round-trip to AWS per request.
    """
    s = get_settings()
    url = (
        f"https://cognito-idp.{s.cognito_region}.amazonaws.com/"
        f"{s.cognito_user_pool_id}/.well-known/jwks.json"
    )
    return PyJWKClient(url, cache_keys=True)


@lru_cache
def _issuer() -> str:
    s = get_settings()
    return f"https://cognito-idp.{s.cognito_region}.amazonaws.com/{s.cognito_user_pool_id}"


def verify_token(token: str) -> dict[str, Any]:
    """Verify a Cognito **id token** and return its claims.

    Raises ``jwt.InvalidTokenError`` (or a subclass) if the signature, audience,
    issuer, expiry, or token_use is wrong.
    """
    settings = get_settings()
    signing_key = _jwks_client().get_signing_key_from_jwt(token)
    claims: dict[str, Any] = jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        audience=settings.cognito_app_client_id,
        issuer=_issuer(),
        options={"require": ["exp", "iss", "aud"]},
    )
    # Reject access/refresh tokens — only the id token carries the user's email.
    if claims.get("token_use") != "id":
        raise jwt.InvalidTokenError("expected a Cognito id token")
    return claims
