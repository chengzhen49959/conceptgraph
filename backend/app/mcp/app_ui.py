"""The MCP App: an interactive concept-graph UI rendered inline in the host.

Registers the ``show_graph`` tool and the ``ui://graph/app.html`` resource
(``text/html;profile=mcp-app``) the host renders in a sandboxed iframe. The tool
returns the graph data AND links the UI via ``_meta.ui.resourceUri``; the host
delivers that result to the iframe (``ontoolresult``), which then drives the
server over the postMessage bridge (``callServerTool`` → concept_get /
memory_search / memory_ask). All data flows through the bridge, so the iframe
needs no network access of its own.

The HTML is a prebuilt single-file bundle (see ``mcp-app/``); rebuild + copy it
into ``static/graph-app.html`` with ``mcp-app/`` ``npm run build``.
"""

from __future__ import annotations

from pathlib import Path

from app.db import session_scope
from app.mcp.server import mcp_server
from app.mcp.tools import _require_sub, _resolve_workspace
from app.services.graph_read import GraphOut, read_graph

GRAPH_APP_URI = "ui://graph/app.html"
_HTML = (Path(__file__).parent / "static" / "graph-app.html").read_text(encoding="utf-8")


@mcp_server.resource(GRAPH_APP_URI, mime_type="text/html;profile=mcp-app")
def graph_app_html() -> str:
    """The interactive concept-graph App (an HTML UI bundle)."""
    return _HTML


@mcp_server.tool(meta={"ui": {"resourceUri": GRAPH_APP_URI}})
async def show_graph(workspace_id: str | None = None) -> GraphOut:
    """Open the interactive concept-graph explorer for the user's library and
    return its data. The host renders the graph inline; the user can click nodes
    to drill into concepts and search/ask from the panel. Prefer this over
    graph_get when the user wants to *see* or explore the graph."""
    sub = _require_sub()
    async with session_scope() as session:
        ws_id = await _resolve_workspace(session, sub, workspace_id)
        return await read_graph(session, ws_id)
