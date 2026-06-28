"""Mint a Personal Access Token (PAT) for the MCP endpoint.

A PAT lets an AI client connect by pasting one bearer token (Claude Desktop /
Cursor via ``mcp-remote --header``), skipping the OAuth browser flow. The token
is a long-lived JWT this backend signs with ``MCP_PAT_SECRET`` and carries the
user's Cognito ``sub``, so it sees exactly that user's personal workspace.

Usage:
    uv run python _mint_pat.py --email you@example.com
    uv run python _mint_pat.py --sub <cognito-sub-uuid>
    uv run python _mint_pat.py --email you@example.com --read-only --days 90

``--email`` resolves the ``sub`` via Cognito (needs ``cognito-idp:AdminGetUser``
/ ``ListUsers``). The minting host must have the SAME ``MCP_PAT_SECRET`` as the
running server, or the minted token won't verify (set it on Render for prod).
"""

from __future__ import annotations

import argparse
import json

import boto3

from app.config import get_settings
from app.mcp.pat import mint_pat


def _resolve_sub_by_email(email: str) -> str:
    """Look up a Cognito user's ``sub`` by email. Tries admin_get_user (works
    when email is the username/alias), then falls back to a ListUsers filter."""
    s = get_settings()
    c = boto3.client("cognito-idp", region_name=s.cognito_region)
    pool = s.cognito_user_pool_id
    try:
        user = c.admin_get_user(UserPoolId=pool, Username=email)
        attrs = {a["Name"]: a["Value"] for a in user["UserAttributes"]}
    except c.exceptions.UserNotFoundException:
        found = c.list_users(UserPoolId=pool, Filter=f'email = "{email}"', Limit=1)
        users = found.get("Users", [])
        if not users:
            raise SystemExit(f"no Cognito user with email {email!r} — sign up first")
        attrs = {a["Name"]: a["Value"] for a in users[0]["Attributes"]}
    sub = attrs.get("sub")
    if not sub:
        raise SystemExit(f"user {email!r} has no sub attribute")
    return sub


def _client_config(mcp_url: str, token: str) -> str:
    # Pass the bearer via mcp-remote's ${ENV} substitution rather than inlining
    # "Authorization: Bearer <t>": mcp-remote splits --header on the first colon
    # and keeps the leading space, yielding " Bearer <t>", which breaks the auth
    # scheme (-> 401). The env form sidesteps that parsing quirk.
    return json.dumps(
        {
            "mcpServers": {
                "concept-graph": {
                    "command": "npx",
                    "args": [
                        "-y",
                        "mcp-remote",
                        mcp_url,
                        "--header",
                        "Authorization:${AUTH_HEADER}",
                    ],
                    "env": {"AUTH_HEADER": f"Bearer {token}"},
                }
            }
        },
        indent=2,
    )


def main() -> None:
    ap = argparse.ArgumentParser(description="Mint an MCP Personal Access Token")
    who = ap.add_mutually_exclusive_group(required=True)
    who.add_argument("--email", help="Cognito user email/username (resolves the sub)")
    who.add_argument("--sub", help="Cognito sub (uuid) to bind the token to")
    ap.add_argument("--read-only", action="store_true", help="grant read scope only")
    ap.add_argument("--days", type=int, default=3650, help="validity in days (default 3650)")
    ap.add_argument("--name", default="", help="label stored in the token")
    args = ap.parse_args()

    s = get_settings()
    if not s.mcp_pat_secret:
        raise SystemExit("MCP_PAT_SECRET is not set — add it to backend/.env.local first")

    sub = args.sub or _resolve_sub_by_email(args.email)
    read_scope, write_scope = s.mcp_scopes
    scopes = read_scope if args.read_only else f"{read_scope} {write_scope}"
    token = mint_pat(sub, scopes=scopes, days=args.days, name=args.name)
    mcp_url = f"{s.mcp_issuer}/mcp"

    print("\n=== MCP Personal Access Token (sensitive — store like a password) ===")
    print(token)
    print(f"\nsub:     {sub}")
    print(f"scopes:  {scopes}")
    print(f"expires: {args.days} days")
    print(f"MCP URL: {mcp_url}")
    print("\n--- Claude Desktop / Cursor (mcp-remote) config ---")
    print(_client_config(mcp_url, token))


if __name__ == "__main__":
    main()
