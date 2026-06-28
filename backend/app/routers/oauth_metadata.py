"""OAuth 2.0 Authorization Server metadata for MCP clients.

This backend is an OAuth Resource Server; FastMCP advertises the backend's own
origin as the authorization server (``AuthSettings.issuer_url``) and serves the
protected-resource metadata. MCP clients then fetch *authorization-server*
metadata here. We delegate the real ``authorize``/``token`` endpoints to
Cognito's Hosted UI but inject our own ``registration_endpoint`` (the ``/register``
shim), because Cognito has no Dynamic Client Registration and its OIDC document
omits one.

Note on ``issuer``: the access token's ``iss`` is Cognito's, while this metadata's
``issuer`` is our origin. Cognito does not return an ``iss`` parameter on the
authorization response, so RFC 9207 issuer-matching is not triggered in clients;
the token is still validated against Cognito's JWKS + issuer by the verifier.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.config import get_settings

router = APIRouter(tags=["oauth"])


def _as_metadata() -> dict:
    s = get_settings()
    base = s.cognito_hosted_ui_base
    issuer = s.mcp_issuer
    read_scope, write_scope = s.mcp_scopes
    jwks = (
        f"https://cognito-idp.{s.cognito_region}.amazonaws.com/"
        f"{s.cognito_user_pool_id}/.well-known/jwks.json"
    )
    return {
        "issuer": issuer,
        "authorization_endpoint": f"{base}/oauth2/authorize" if base else None,
        "token_endpoint": f"{base}/oauth2/token" if base else None,
        "registration_endpoint": f"{issuer}/register",
        "jwks_uri": jwks,
        "scopes_supported": ["openid", "email", read_scope, write_scope],
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code", "refresh_token"],
        "token_endpoint_auth_methods_supported": ["none"],
        "code_challenge_methods_supported": ["S256"],
    }


@router.get("/.well-known/oauth-authorization-server")
def oauth_authorization_server() -> dict:
    """RFC 8414 authorization-server metadata (Cognito endpoints + our /register)."""
    return _as_metadata()


@router.get("/.well-known/openid-configuration")
def openid_configuration() -> dict:
    """Alias for clients that probe the OIDC discovery path instead of RFC 8414."""
    return _as_metadata()
