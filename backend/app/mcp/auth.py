"""OAuth 2.1 Resource-Server auth for the MCP endpoint.

The MCP server validates a Cognito **access token** (see
``cognito.verify_access_token``) and exposes the caller's identity (the Cognito
``sub``) to the tools. It never forwards the token anywhere — tools call the
service layer directly — so the spec's token-passthrough prohibition cannot be
violated.
"""

from __future__ import annotations

from urllib.parse import urlparse

import anyio.to_thread
import jwt
from mcp.server.auth.provider import AccessToken, TokenVerifier
from mcp.server.auth.settings import AuthSettings
from mcp.server.transport_security import TransportSecuritySettings

from app.cognito import verify_access_token
from app.config import get_settings
from app.mcp.pat import verify_pat


class CognitoAccessTokenVerifier(TokenVerifier):
    """Verifies the bearer as a Cognito access token carrying an MCP scope."""

    async def verify_token(self, token: str) -> AccessToken | None:
        read_scope, write_scope = get_settings().mcp_scopes
        # Try the PAT fast path first (a local HMAC check; None if not a PAT),
        # then fall back to a Cognito access token (JWKS, CPU-bound, off-thread).
        claims = verify_pat(token)
        if claims is None:
            try:
                claims = await anyio.to_thread.run_sync(verify_access_token, token)
            except jwt.PyJWTError:
                # Broad PyJWTError (not just InvalidTokenError): a non-Cognito
                # bearer — e.g. an expired/foreign PAT that fell through above —
                # has no matching JWKS key, so get_signing_key_from_jwt raises
                # PyJWKClientError. Treat any JWT/JWKS failure as unauthenticated
                # (return None -> 401) instead of letting it surface as a 500.
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


def mcp_transport_security() -> TransportSecuritySettings:
    """DNS-rebinding protection for the /mcp endpoint. FastMCP enables Host
    validation when auth is set; behind a proxy (Render) the Host is the public
    domain, so it must be allow-listed or every request 421s. Derived from
    ``mcp_public_url`` so prod and local both work without hardcoding."""
    s = get_settings()
    host = urlparse(s.mcp_issuer).netloc  # e.g. concept-graph-api.onrender.com or 127.0.0.1:8000
    base = host.split(":")[0]
    allowed_hosts = [host, f"{base}:*", "localhost", "localhost:*", "127.0.0.1:*"]
    allowed_origins = [
        s.mcp_issuer,
        "http://localhost:*",
        "http://127.0.0.1:*",
        "https://localhost:*",
    ]
    return TransportSecuritySettings(
        enable_dns_rebinding_protection=True,
        allowed_hosts=allowed_hosts,
        allowed_origins=allowed_origins,
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
