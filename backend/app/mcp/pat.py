"""Personal Access Tokens (PATs) for the MCP endpoint — a static-bearer fast path.

A PAT is a long-lived JWT this backend signs with its own secret
(``settings.mcp_pat_secret``), carrying the user's Cognito ``sub`` and the MCP
scopes. It lets a client connect by pasting one bearer token (Claude Desktop /
Cursor via ``mcp-remote --header``), skipping the OAuth browser flow. The OAuth
path is untouched and remains the option for clients that drive it (claude.ai web).

Stateless by design (no DB): both minting and verification need only the shared
secret, so a PAT can be minted anywhere the secret is set. Revocation is coarse —
rotating ``MCP_PAT_SECRET`` invalidates every PAT at once. Per-token revocation
would need a store; not built until needed.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

from app.config import get_settings

# Distinct issuer + token_use so a PAT can never be confused with a Cognito token
# (different signing alg too: PATs are HS256, Cognito tokens RS256).
PAT_ISSUER = "concept-graph-pat"
PAT_TOKEN_USE = "pat"
PAT_ALG = "HS256"


def mint_pat(sub: str, *, scopes: str, days: int = 3650, name: str = "") -> str:
    """Sign a PAT for Cognito user ``sub`` carrying ``scopes`` (a space-separated
    scope string, e.g. ``"concept-graph/read concept-graph/write"``).

    ``days`` is the validity window; the 10-year default makes it effectively
    paste-once. Raises ``RuntimeError`` if no signing secret is configured.
    """
    secret = get_settings().mcp_pat_secret
    if not secret:
        raise RuntimeError("MCP_PAT_SECRET is not set; cannot mint a PAT")
    now = datetime.now(timezone.utc)
    claims: dict[str, Any] = {
        "iss": PAT_ISSUER,
        "sub": sub,
        "scope": scopes,
        "token_use": PAT_TOKEN_USE,
        "iat": now,
        "exp": now + timedelta(days=days),
    }
    if name:
        claims["name"] = name
    return jwt.encode(claims, secret, algorithm=PAT_ALG)


def verify_pat(token: str) -> dict[str, Any] | None:
    """Return a PAT's claims if ``token`` is a valid PAT, else ``None``.

    Returns ``None`` rather than raising so the token verifier can fall through to
    the Cognito access-token path. Returns ``None`` immediately when no secret is
    configured (PATs disabled), so a stray HS256 token can't be force-validated.
    """
    secret = get_settings().mcp_pat_secret
    if not secret:
        return None
    try:
        claims: dict[str, Any] = jwt.decode(
            token,
            secret,
            algorithms=[PAT_ALG],
            issuer=PAT_ISSUER,
            options={"require": ["exp", "iss", "sub"]},
        )
    except jwt.InvalidTokenError:
        return None
    if claims.get("token_use") != PAT_TOKEN_USE:
        return None
    return claims
