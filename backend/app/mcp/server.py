"""The MCP server: a FastMCP instance mounted into the FastAPI app at ``/mcp``.

Tools and the graph App UI are registered for their decorator side effects by
importing ``app.mcp.tools`` and ``app.mcp.app_ui`` at the bottom of this module
(after ``mcp_server`` exists, to keep the import cycle resolvable).

Mounting (see ``app/main.py``): the FastMCP Starlette app is mounted at the root
``/`` *after* the FastAPI routers, so the existing ``/api`` routes win and the
auth discovery documents (``/.well-known/...``) land at the origin root where the
401 ``WWW-Authenticate`` header points. ``streamable_http_path="/mcp"`` keeps the
endpoint exactly ``/mcp`` (no trailing-slash redirect).
"""

from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from app.mcp.auth import (
    CognitoAccessTokenVerifier,
    mcp_auth_settings,
    mcp_transport_security,
)

mcp_server = FastMCP(
    "Concept Graph Memory",
    instructions=(
        "The user's personal concept-graph knowledge base, usable as the AI's "
        "external memory. Use it to search saved material, answer questions "
        "grounded in it (with citations), browse the concept graph, and save new "
        "notes back into it."
    ),
    token_verifier=CognitoAccessTokenVerifier(),
    auth=mcp_auth_settings(),
    transport_security=mcp_transport_security(),
    streamable_http_path="/mcp",
    stateless_http=True,
    json_response=True,
)


@mcp_server.tool()
async def ping() -> str:
    """Liveness check: returns 'pong' when the MCP server is reachable and your
    access token is valid. Use it to confirm the connection before other tools."""
    return "pong"


# Register tools + the graph App by importing for their decorator side effects.
# Imported last so `mcp_server` is already defined when these modules import it;
# tools before app_ui because app_ui reuses tool helpers.
from app.mcp import tools as _tools  # noqa: E402,F401
from app.mcp import app_ui as _app_ui  # noqa: E402,F401
