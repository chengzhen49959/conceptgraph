"""OAuth 2.1 Resource-Server auth for the MCP endpoint.

The MCP server validates a Cognito **access token** (see
``cognito.verify_access_token``) and exposes the caller's identity (the Cognito
``sub``) to the tools. It never forwards the token anywhere — tools call the
service layer directly — so the spec's token-passthrough prohibition cannot be
violated.
"""

from __future__ import annotations

import anyio.to_thread
import jwt
from mcp.server.auth.provider import AccessToken, TokenVerifier
from mcp.server.auth.settings import AuthSettings

from app.cognito import verify_access_token
from app.config import get_settings


class CognitoAccessTokenVerifier(TokenVerifier):
    """Verifies the bearer as a Cognito access token carrying an MCP scope."""

    async def verify_token(self, token: str) -> AccessToken | None:
        read_scope, write_scope = get_settings().mcp_scopes
        try:
            # JWKS verification is a local, CPU-bound signature check.
            claims = await anyio.to_thread.run_sync(verify_access_token, token)
        except jwt.InvalidTokenError:
            return None
        scopes = claims.get("scope", "").split()
        if read_scope not in scopes and write_scope not in scopes:
            return None
        return AccessToken(
            token=token,
            client_id=claims.get("client_id", ""),
            scopes=scopes,
            subject=claims["sub"],
            claims=claims,
        )


def mcp_auth_settings() -> AuthSettings:
    """Resource-Server settings: advertise this backend as the OAuth issuer and
    bind tokens to the ``/mcp`` resource. (pydantic coerces the str URLs.)"""
    s = get_settings()
    read_scope, _ = s.mcp_scopes
    return AuthSettings(
        issuer_url=s.mcp_issuer,
        resource_server_url=s.mcp_resource_url,
        required_scopes=[read_scope],
    )
