from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.cognito import verify_token

bearer_scheme = HTTPBearer(auto_error=True)


@dataclass
class CurrentUser:
    """The authenticated Cognito user behind a request."""

    id: str  # Cognito subject (`sub`) — the stable unique user id
    email: str | None
    token: str  # raw id token, if a handler needs the original claims


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CurrentUser:
    """Validate the bearer id token against the Cognito User Pool's JWKS.

    Verification is local (signature + claims) using cached public keys, so
    there is no network round-trip to AWS per request.
    """
    token = credentials.credentials
    try:
        claims = verify_token(token)
    except jwt.PyJWTError:
        # Broad PyJWTError, not just InvalidTokenError: a token whose key id isn't
        # in the pool's JWKS (rotated-out / foreign token) makes
        # get_signing_key_from_jwt raise PyJWKClientError, and a JWKS fetch blip
        # raises PyJWKClientConnectionError — both are PyJWTError but NOT
        # InvalidTokenError, so the narrow catch let them surface as a 500 on every
        # authed endpoint. Treat any JWT/JWKS failure as unauthenticated (401).
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    return CurrentUser(id=claims["sub"], email=claims.get("email"), token=token)
