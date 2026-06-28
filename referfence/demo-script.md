# Concept Graph — Hackathon Demo Script

> **One-liner:** Students turn the papers they read into a living, auto-deduplicating **concept graph**; mentors review and steer that graph asynchronously. Import a document → concepts are extracted, merged across papers, clustered into topics, and laid out on an interactive graph you can search, ask, and annotate.

This is a recording guide. Each section has **what to say** (the pitch) and **what to show on screen** (the demo beats). Five acts: the Pipeline, the three Entry Points (Upload / MCP / Browser Extension), the UI, and how the Graph runs.

---

## 0. 30-second framing (open the recording with this)

A student researcher reading a stack of papers ends up with isolated PDFs and scattered notes. The same concept recurs across ten papers but is never merged; the relationships between concepts are invisible; and there's no way to *ask the library a question*. Their mentor, meanwhile, has no shared structured view of where the student's thinking is going.

**Concept Graph** fixes all three:
- **Auto-structure** — every imported document is broken into concepts + relationships and merged into one growing graph (no manual dedup).
- **Ask the library** — semantic search + cited RAG answers that light up the exact concepts an answer relies on.
- **Async mentorship** — a shared workspace where a mentor highlights / flags / comments / edits the graph directly, every edit audited and undoable.

**Stack (say it once, fast):** Next.js 16 on Vercel (UI only, no AI, no DB) → FastAPI on Render (all AI + heavy work) → Aurora PostgreSQL + pgvector (single source of truth) → Redis queue + S3 for raw docs. Auth is Amazon Cognito end to end.

---

## 1. The Pipeline — "import a document, watch it become a graph"

**Say:** The core is an async ingestion pipeline. The browser never does AI; it uploads bytes and polls for a live stage. Everything heavy runs on a background worker.

**Show:** Drop a PDF, then narrate the status chip flipping through the live stages:

```
pending → parsing → chunking → embedding → extracting → merging → clustering → done
```

The pipeline, stage by stage (pick 3–4 to actually narrate; the rest are "and behind the scenes…"):

1. **Parse** — PDF → layout-aware Markdown (PyMuPDF4LLM), rendered **one column at a time** so two-column papers keep reading order. References/bibliography stripped. PDF noise removed — figure/formula placeholders and OCR'd chart-axis text never become junk concepts.
2. **Chunk** — split by structure + token window; content-hashed for idempotency.
3. **Embed** — each chunk → OpenAI embedding → stored in pgvector.
4. **Extract** *(the interesting bit)* — per-chunk LLM extraction runs at **pure recall**: surface *every* named concept a passage mentions. A single passage can't know what's central, so it doesn't try to judge.
5. **Core-concept gate** *(the differentiator — emphasize this)* — one document-level LLM call decides centrality against the paper's own **framing** (title + abstract + intro + conclusion), not an aggregate summary. So a tool the paper merely *uses* (an optimizer, a normalization trick) is **not** mistaken for what the paper is *about*. Surveys are auto-detected and get a relaxed gate (keep the field's sub-areas, not just section headings).
6. **Merge / dedup** *(the headline feature — demo it live, see below)* — a new concept is matched against existing ones: exact name or alias resolves instantly with no LLM call; otherwise vector similarity + an LLM judge confirm a match → merge (fold description, add alias + provenance) instead of creating a duplicate node.
7. **Edges + co-occurrence** — typed relations from the LLM, plus a hidden co-occurrence substrate (concept pairs sharing a chunk) that densifies the graph for clustering.
8. **Clustering** — two-level Leiden community detection over the weighted graph → named topic clusters with a topic→sub-topic hierarchy. Recomputed after every import.
9. **Finalize** — status flips to `done`, the open graph refetches on its next poll.

**Money shot — the live dedup demo:**
> Import a *second* paper that shares a concept with the first. Show that **no duplicate node appears** — the original node's mention count goes up instead. This is F4, the core differentiator. Say: "ten papers, one node per real concept."

**Safety notes worth one sentence each:** ingest is enqueued only *after* the S3 upload lands (no "file not found" race); each file ingests independently (one bad file fails only itself); image uploads are rejected up front (415 — no OCR); the heavy merge phase runs under a per-workspace lock so concurrent imports never spawn duplicates.

---

## 2. Entry Point A — File Upload

**Say:** The default way in. One file or many at once.

**Show:**
- Multi-select a few PDFs → they all start ingesting in parallel (client orchestrates presign → PUT → ingest, 3 at a time).
- The documents list shows each one's **live stage**, not just a spinner.
- A failed import shows its error inline with a one-click delete ("delete & re-upload to retry").

**Under the hood (one line):** `POST /api/documents` presigns an S3 URL + inserts the row `pending` (no job yet) → browser PUTs bytes straight to S3 → `POST /api/documents/{id}/ingest` enqueues the worker. Split on purpose so the worker never reads S3 before the bytes land.

---

## 3. Entry Point B — MCP Server (your AI client as the front door)

**Say:** The graph isn't just usable from our app — it's exposed as **external memory** for the student's own AI client (Claude, ChatGPT, Cursor). Same data, same retrieval code, accessed over MCP.

**Show:** In Claude Desktop / claude.ai, connect to the `/mcp` endpoint, then:
- Ask a question → it calls `memory_ask` and answers from *your* library, cited.
- Ask "what's in my graph" → `graph_get` / `concept_get`.
- Say "save this" → `memory_write` clips a page into the graph (write scope).

**The five tools:** `memory_search`, `memory_ask` (cited), `graph_get`, `concept_get`, `memory_write` — all reusing the *exact* service-layer code the web app's HTTP routers call.

**Architecture worth name-dropping:** It's a FastMCP Streamable-HTTP server mounted at `/mcp` on the same backend — and an **OAuth 2.1 Resource Server** with **Cognito as the Authorization Server**. An unauthenticated call returns `401` + discovery metadata; the client runs auth-code + PKCE against Cognito and gets an access token carrying a `concept-graph/read|write` scope. There's also a **Personal Access Token** path (paste one bearer, skip the browser flow) for desktop clients. Tools resolve the caller's identity (`sub`) and call the service layer directly — no token passthrough, no HTTP self-call.

---

## 4. Entry Point C — Browser Extension ("Graph Clipper")

**Say:** A standalone Chrome extension (MV3) so you clip the page you're *reading* straight into your graph — a second ingestion entry point alongside upload.

**Show:** On any article, hit the floating clip button (or toolbar icon / right-click / `Ctrl/Cmd+Shift+S`) → a side panel opens with a clean preview → pick a workspace → confirm. Minutes later the new concepts appear in the open web app (surfaced by its poll).

**What's clever:**
- **Clean extraction, client-side only** — Mozilla Readability strips nav/ads/sidebar/footer; Turndown+GFM keeps headings/lists/tables/code and drops decorative images and link URLs (roughly **halving** the payload — noise the concept extractor never reads). **Page math is preserved**: MathML is pulled to `$…$`/`$$…$$` LaTeX *before* Readability runs (which would otherwise strip `<math>` as non-content). No AI runs in the extension.
- **No second login** — it reuses the web app's Cognito session (reads the id-token cookie, refreshes near expiry).
- **Server-side de-dup** — clip the same URL twice into a workspace and you get the existing document back, no duplicate. The clip hits `POST /api/imports/clip`, the backend writes the Markdown to S3 itself and runs the **same** pipeline as upload.

**One line on the FAB hack** (if you want a "we sweated the details" moment): the floating button opens a keepalive port on *pointerdown* to wake the service worker, so `sidePanel.open()` still lands inside the user-gesture window — otherwise a cold-started worker opens the panel too late and the click silently does nothing.

---

## 5. The UI — one canvas, one sidebar, color end-to-end

**Say:** The whole app is a single surface: the graph canvas in the center, one control sidebar on the left. No floating panels, no in-app reader — the graph is always what you see.

**Show and narrate:**

- **Graph canvas** (react-force-graph) — concept nodes colored by topic cluster. Drag, zoom, select.
- **Color runs end-to-end** — a topic's dot in the sidebar, its concept dots, and its nodes on the canvas all wear the same color. The sidebar and the graph are the same picture.
- **Two-way sync** — select a node on the canvas and its row reveals itself in the sidebar (topic expands, row scrolls into view). Click a topic in the sidebar and its cluster focuses on the canvas (highlight + zoom-to-fit).
- **Smart camera** — selecting a node centers it + its neighbors at the current zoom; deselecting (or clicking empty space) zooms back out to the whole-graph overview.
- **Labels never overlap** — a name that would collide hops to a free side of its dot (eight candidate positions, least-crowded wins) instead of being hidden. Important nodes claim clean space first; off-screen labels are culled so it stays smooth at hundreds of nodes.
- **One operation model for every row** — click = primary action (document → open source, topic → focus, concept → select); the chevron expands a topic; everything else (hide, recolor, delete) is on a right-click menu + hover `⋯`. Batch delete via a per-section **Select** toggle, with the cascade spelled out ("Delete this topic and the 23 concepts inside it?").
- **Loading vs error vs empty** — a returning user sees a spinner while the graph fetches and an error+Retry on failure — never a false "your graph is empty" that reads as data loss.

**Two things to actually click:**
1. **⌘K palette** — type to search (vector recall over concepts + passages, layered on an instant client-side substring match). Switch to **Ask** mode → ask a question → a **cited answer streams in** with `[n]` chips and a Sources list, and **the concepts it relies on light up on the graph live** (by concept id, not fuzzy text). This is F8 — the showpiece.
2. **Chat dock** — the same agent, in-product, as a multi-turn docked chat beside the graph: live tool-activity trace, streamed cited answer, concept chips that jump to nodes.

**Collaboration (if time):** share a workspace by a reusable link with a role (owner/editor/commenter/viewer); a mentor highlights / flags / comments on concepts, or edits the graph directly — every human edit audited and undoable. The student sees it on the next ~2.5s poll. No realtime channel by design.

---

## 6. How the Graph Runs — the mechanics behind the picture

**Say:** The graph isn't a drawing — it's a live projection of the data model. Here's what makes it move.

- **Nodes = concepts, edges = relationships.** Each concept carries a pgvector embedding (HNSW index), aliases (merged synonyms), and mention provenance (which chunk of which document). Manual "research-direction" nodes (question / hypothesis / next step) carry no embedding and never merge.
- **Two kinds of edges.** `relation` edges (LLM-extracted, shown on the canvas) and a hidden `cooccur` substrate (concept pairs sharing a chunk). Displayed relations alone are sparse; co-occurrence densifies the graph so clustering finds real communities. Repeated edges increment weight.
- **Color = cluster.** Two-level Leiden community detection over the weighted graph produces topic clusters (leaf) grouped under parent topics (`parent_id` hierarchy). An LLM labels each cluster. An orphan concept with no edge is rescued by an embedding-kNN link so it joins a real topic instead of floating alone. Re-clustering runs after every import — new cluster ids recolor the graph, and the canvas re-syncs node colors in place rather than re-heating the layout.
- **The graph is alive.** New documents add/merge nodes, bump mention counts, and re-cluster — all surfaced to an open browser by polling. The picture grows as you read.
- **Three retrieval paths, one graph.** Semantic search (vector ANN), RAG Q&A (retrieve top-k chunks → cited answer → light cited concepts), and the agent's graph-aware concept-first retrieval (find the best concept node, walk its cluster siblings + typed neighbors, gather passages across *all* papers) — every answer can point back to a node you can click.

**Closing line for the recording:** "One graph, fed by uploads, web clips, and your AI client — that you can see, search, ask, and review together."

---

## Appendix — quick reference for the demo operator

| Topic | Where it lives in code |
| --- | --- |
| Ingestion pipeline | `backend/app/worker.py`, `backend/app/services/`, `backend/app/ai/` |
| Core-concept gate | `backend/app/services/thesis.py`, `backend/app/ai/extract.py` |
| Merge / dedup | `backend/app/ai/merge.py`, `backend/app/services/concepts.py`, `dedup_sweep.py` |
| Clustering | `backend/app/services/clustering.py` |
| Upload endpoints | `backend/app/routers/documents.py` |
| MCP server | `backend/app/mcp/` (`server.py`, `tools.py`, `auth.py`, `pat.py`) |
| Web clip | `backend/app/routers/imports.py`, `backend/app/services/clip.py` |
| Browser extension | `extension/src/` (`content/fab.ts`, `content/extract.ts`, `panel/`) |
| Graph canvas + sidebar | `frontend/src/components/workspace/GraphCanvas.tsx`, `NavSidebar.tsx`, `GraphControls.tsx` |
| Search / Ask palette | `frontend/src/components/workspace/SearchPalette.tsx` |
| Chat dock (agent) | `frontend/src/components/workspace/ChatPanel.tsx`, `backend/app/services/agent.py` |

**Full architecture:** `arc.md` · **Product spec:** `prd.md` · **Status:** `project_state.md`
