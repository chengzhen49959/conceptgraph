# mcp-app — Concept Graph MCP App (graph UI)

The interactive concept-graph UI rendered **inline in the host** (Claude/ChatGPT)
as an MCP App. It is the `ui://graph/app.html` resource the backend's `show_graph`
tool references (`backend/app/mcp/app_ui.py`).

- **React + Vite**, bundled to a **single self-contained HTML file**
  (`vite-plugin-singlefile`) so the backend serves it verbatim with no external
  asset fetches.
- Reuses the web app's force-graph look via `react-force-graph-2d` and copies the
  pure helpers `src/cluster-color.ts` / `src/relations.ts` (keep in sync with
  `frontend/src/lib/`).
- Talks to the server only over the MCP Apps postMessage bridge
  (`@modelcontextprotocol/ext-apps`): receives the initial graph via
  `ontoolresult` (with a `graph_get` fallback) and calls `concept_get`,
  `memory_search`, `memory_ask` via `callServerTool`.

## Build + deploy

```bash
cd mcp-app
npm install
npm run build              # -> dist/index.html (single file)
cp dist/index.html ../backend/app/mcp/static/graph-app.html
```

The committed `backend/app/mcp/static/graph-app.html` is what ships (the Render
Python build is Node-free). Re-run the two commands above after changing anything
in `src/` and commit the regenerated HTML.

## Local dev

```bash
npm run dev               # standalone preview (no host bridge; uses graph_get fallback path only if wired)
```

For real bridge testing, load the built app through an MCP Apps host (e.g. the
`@modelcontextprotocol/ext-apps` `basic-host` example, or Claude via a tunnelled
connector) pointed at the backend's `/mcp` endpoint.
