"""One-off: provision the Cognito OAuth bits the MCP server needs (M0).

Idempotent — safe to re-run. Creates (if missing):
  1. a Hosted UI **domain** (so /oauth2/authorize + /oauth2/token exist),
  2. a **resource server** ``concept-graph`` with ``read`` + ``write`` scopes
     (the audience mechanism for Cognito access tokens),
  3. a public **OAuth app client** ``mcp-static`` (auth code + PKCE) usable as a
     pasteable fallback client_id.

Requires the AWS credentials to allow ``cognito-idp:CreateUserPoolDomain``,
``CreateResourceServer``, ``CreateUserPoolClient``, and the matching Describe/List.

Usage:
    uv run python _provision_cognito.py [DOMAIN_PREFIX]   # default: conceptgraph-auth
After it prints the values, set COGNITO_DOMAIN / MCP_RESOURCE_IDENTIFIER /
MCP_PUBLIC_URL in backend/.env.local (and the Render secret group).
"""

from __future__ import annotations

import sys

import boto3
from botocore.exceptions import ClientError

from app.config import get_settings

RESOURCE_ID = "concept-graph"
SCOPES = [
    {"ScopeName": "read", "ScopeDescription": "Read the user's knowledge base"},
    {"ScopeName": "write", "ScopeDescription": "Write to the user's knowledge base"},
]
STATIC_CLIENT_NAME = "mcp-static"
# Loopback callbacks cover local MCP clients / mcp-remote / Inspector. Hosted
# clients register their own via the /register DCR shim at runtime.
DEFAULT_CALLBACKS = [
    "http://localhost:6274/oauth/callback",  # MCP Inspector
    "http://localhost:33418",  # mcp-remote default
    "http://127.0.0.1:6274/oauth/callback",
]


def main() -> None:
    s = get_settings()
    prefix = sys.argv[1] if len(sys.argv) > 1 else "conceptgraph-auth"
    pool = s.cognito_user_pool_id
    region = s.cognito_region
    c = boto3.client("cognito-idp", region_name=region)
    scope_strs = [f"{RESOURCE_ID}/read", f"{RESOURCE_ID}/write"]

    # 1) Hosted UI domain ------------------------------------------------------
    existing_domain = c.describe_user_pool(UserPoolId=pool)["UserPool"].get("Domain")
    if existing_domain:
        domain = existing_domain
        print(f"[domain] already set: {domain}")
    else:
        try:
            c.create_user_pool_domain(Domain=prefix, UserPoolId=pool)
            domain = prefix
            print(f"[domain] created: {domain}")
        except ClientError as e:
            print(f"[domain] FAILED ({e.response['Error']['Code']}): {e}")
            print("       choose a different prefix or check IAM permissions.")
            return

    # 2) Resource server + scopes ---------------------------------------------
    try:
        c.describe_resource_server(UserPoolId=pool, Identifier=RESOURCE_ID)
        print(f"[resource-server] already exists: {RESOURCE_ID}")
    except c.exceptions.ResourceNotFoundException:
        c.create_resource_server(
            UserPoolId=pool, Identifier=RESOURCE_ID, Name="Concept Graph MCP", Scopes=SCOPES
        )
        print(f"[resource-server] created: {RESOURCE_ID} scopes={scope_strs}")

    # 3) Static public OAuth client -------------------------------------------
    clients = c.list_user_pool_clients(UserPoolId=pool, MaxResults=60)["UserPoolClients"]
    static = next((cl for cl in clients if cl["ClientName"] == STATIC_CLIENT_NAME), None)
    if static:
        client_id = static["ClientId"]
        print(f"[app-client] already exists: {STATIC_CLIENT_NAME} ({client_id})")
    else:
        resp = c.create_user_pool_client(
            UserPoolId=pool,
            ClientName=STATIC_CLIENT_NAME,
            GenerateSecret=False,
            AllowedOAuthFlows=["code"],
            AllowedOAuthFlowsUserPoolClient=True,
            AllowedOAuthScopes=["openid", "email", *scope_strs],
            CallbackURLs=DEFAULT_CALLBACKS,
            SupportedIdentityProviders=["COGNITO"],
            ExplicitAuthFlows=["ALLOW_REFRESH_TOKEN_AUTH"],
        )
        client_id = resp["UserPoolClient"]["ClientId"]
        print(f"[app-client] created: {STATIC_CLIENT_NAME} ({client_id})")

    host = f"{domain}.auth.{region}.amazoncognito.com"
    print("\n=== set these in backend/.env.local (and the Render secret group) ===")
    print(f"COGNITO_DOMAIN={domain}")
    print(f"MCP_RESOURCE_IDENTIFIER={RESOURCE_ID}")
    print("MCP_PUBLIC_URL=http://127.0.0.1:8000   # local; use the Render URL in prod")
    print(f"\nHosted UI base: https://{host}")
    print(f"Static fallback client_id: {client_id}")


if __name__ == "__main__":
    main()
