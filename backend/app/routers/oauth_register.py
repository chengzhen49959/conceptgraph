"""Dynamic Client Registration (RFC 7591) shim.

Cognito has no DCR, but MCP hosts (Claude, ChatGPT, Cursor) register a client at
connect time. This translates a DCR request into a Cognito
``create_user_pool_client`` call, returning a public (PKCE, no-secret) client
bound to the caller's redirect URIs.

Security: only redirect URIs matching the configured prefix allowlist are
accepted (no open-redirect client registration), and registrations are
rate-limited per client IP to protect the Cognito app-client quota.
"""

from __future__ import annotations

import logging
import time
from collections import defaultdict, deque

import boto3
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.config import get_settings

router = APIRouter(tags=["oauth"])
log = logging.getLogger("mcp.register")

# Per-IP sliding-window cap. In-memory + per-process (best-effort; a multi-instance
# deploy multiplies the effective limit — acceptable, the redirect allowlist is the
# real guard). Tightened further is a follow-up if abuse appears.
_RATE_WINDOW_S = 3600
_RATE_MAX = 20
_hits: dict[str, deque[float]] = defaultdict(deque)


def _rate_limit(ip: str) -> None:
    now = time.monotonic()
    q = _hits[ip]
    while q and now - q[0] > _RATE_WINDOW_S:
        q.popleft()
    if len(q) >= _RATE_MAX:
        raise HTTPException(429, "registration rate limit exceeded")
    q.append(now)


class RegistrationRequest(BaseModel):
    # Accept and ignore the other RFC 7591 metadata fields clients may send.
    model_config = {"extra": "allow"}

    redirect_uris: list[str] = []
    client_name: str | None = None


def _allowed(uri: str, prefixes: list[str]) -> bool:
    return any(uri.startswith(p) for p in prefixes)


@router.post("/register", status_code=201)
def register(body: RegistrationRequest, request: Request) -> dict:
    s = get_settings()
    _rate_limit(request.client.host if request.client else "unknown")

    prefixes = [p.strip() for p in s.mcp_allowed_redirect_schemes.split(",") if p.strip()]
    uris = body.redirect_uris
    if not uris:
        raise HTTPException(400, "redirect_uris required")
    bad = [u for u in uris if not _allowed(u, prefixes)]
    if bad:
        raise HTTPException(400, f"redirect_uri not in allowlist: {bad}")

    read_scope, write_scope = s.mcp_scopes
    client = boto3.client("cognito-idp", region_name=s.cognito_region)
    try:
        resp = client.create_user_pool_client(
            UserPoolId=s.cognito_user_pool_id,
            ClientName=(body.client_name or "mcp-dcr")[:128],
            GenerateSecret=False,
            AllowedOAuthFlows=["code"],
            AllowedOAuthFlowsUserPoolClient=True,
            AllowedOAuthScopes=["openid", "email", read_scope, write_scope],
            CallbackURLs=uris,
            SupportedIdentityProviders=["COGNITO"],
            ExplicitAuthFlows=["ALLOW_REFRESH_TOKEN_AUTH"],
        )
    except Exception as e:  # noqa: BLE001 — surface any AWS failure as a 502
        log.warning("DCR create_user_pool_client failed", exc_info=True)
        raise HTTPException(502, "client registration failed") from e

    cid = resp["UserPoolClient"]["ClientId"]
    log.info("registered MCP client %s for %s", cid, uris)
    return {
        "client_id": cid,
        "redirect_uris": uris,
        "grant_types": ["authorization_code", "refresh_token"],
        "response_types": ["code"],
        "token_endpoint_auth_method": "none",
        "scope": f"openid email {read_scope} {write_scope}",
    }
