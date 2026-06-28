"""The MCP server: a FastMCP instance mounted into the FastAPI app at ``/mcp``.

Tools are registered for their decorator side effects by importing
``app.mcp.tools`` at the bottom of this module (after ``mcp_server`` exists, to
keep the import cycle resolvable).

Mounting (see ``app/main.py``): the FastMCP Starlette app is mounted at the root
``/`` *after* the FastAPI routers, so the existing ``/api`` routes win and the
auth discovery documents (``/.well-known/...``) land at the origin root where the
401 ``WWW-Authenticate`` header points. ``streamable_http_path="/mcp"`` keeps the
endpoint exactly ``/mcp`` (no trailing-slash redirect).
"""

from __future__ import annotations

import base64
from pathlib import Path

from mcp.server.fastmcp import FastMCP
from mcp.types import Icon

from app.mcp.auth import (
    CognitoAccessTokenVerifier,
    mcp_auth_settings,
    mcp_transport_security,
)

# The connector icon shown by MCP clients. Read once at import and inlined as a
# self-contained data URI so no static route / external host is needed (the data
# URI travels inside the ``initialize`` response's server info). ``icon.png``
# lives beside this module so it ships with the backend deploy regardless of CWD.
_icon_data_uri = "data:image/png;base64," + base64.b64encode(
    (Path(__file__).parent / "icon.png").read_bytes()
).decode("ascii")

mcp_server = FastMCP(
    "Concept Graph Memory",
    instructions=(
        "The user's personal concept-graph knowledge base, usable as the AI's "
        "external memory. Use it to search saved material, answer questions "
        "grounded in it (with citations), browse the concept graph, and save new "
        "notes back into it."
    ),
    icons=[Icon(src=_icon_data_uri, mimeType="image/png", sizes=["512x512"])],
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


# Register the tools by importing for their decorator side effects. Imported last
# so `mcp_server` is already defined when the module imports it.
from app.mcp import tools as _tools  # noqa: E402,F401
