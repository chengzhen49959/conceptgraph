# ARC — Target Architecture (English)

> **Product:** a **collaborative research concept-graph** — students grow a concept graph from their library; mentors review it asynchronously (highlight / flag / comment + direct graph edits with audit & undo). Project workspaces are shared by a reusable link with per-member roles. The architecture below serves both the ingestion/AI core and this async-collaboration layer. See `prd.md`.

## 1. Target Architecture Layers

Three layers, two compute planes, one source of truth:

- **Frontend — Next.js (deployed on Vercel):** UI + lightweight low-latency logic. Calls no AI; does not connect to the database directly.
- **Backend — FastAPI (deployed on Render):** all heavy processing + all AI. Hosts the ingestion pipeline, clustering, semantic search, RAG.
- **Data — Aurora PostgreSQL + pgvector (AWS):** single source of truth, serving relational data, vector search, and graph adjacency.
- **Queue — Redis (Render Key Value):** ingestion job queue.
- **Object storage — S3:** raw documents.

Division-of-labor principle: anything involving embedding / LLM / long-running computation → backend; everything else (light reads/writes) is exposed to the frontend via the backend API. **All database access goes through the Render backend; Vercel does not connect to Aurora directly** (serverless egress IPs aren't static, so allowlisting a direct connection is impractical).

## 2. Core Modules

**Backend (FastAPI / Render)**
- `web` service: FastAPI handling synchronous requests (streamed Q&A, search, ingestion enqueue, status, workspace/member CRUD, concept reads/writes).
- `worker` service: arq (or Celery) queue consumer running the ingestion pipeline and clustering.
- Shared codebase/image; distinguished by start command (uvicorn vs arq).
- AI adapter layer: OpenAI Python SDK, centralizing embedding and LLM calls, prompts, rate limiting.
- Data access layer: SQLAlchemy async / asyncpg with a long-lived connection pool.

**Frontend (Next.js / Vercel)**
- Amplify Auth — cookie-based SSR session, enforced by a proxy route guard (`src/proxy.ts`).
- Graph view (react-force-graph) + manual edit toolbar (create / edit / delete nodes & edges, undo); sidebar controls (filters / display / topics) with multi-select delete for documents, topics, **and individual concepts** (full names recoverable on hover via `title`). Hover/focus highlight eases in/out (canvas redraw gated to the transition via `autoPauseRedraw`, since the sim otherwise stops repainting at rest). Node clones are pinned to a topology signature so refetches don't re-heat the layout, but their `cluster_id` / `name` are re-synced in place from each refetch — so re-clustering (which mints new cluster ids every ingest) recolours the graph and keeps it consistent with the sidebar instead of greying out.
- **Reading view** (`DocumentReader` + `DocumentOutline` + a co-present `GraphCanvas` pane) — the source counterpart of the graph: opening a document from the sidebar opens its *original* source **alongside** the graph (Obsidian's text + 关系图谱 + outline layout), branched on `source_url` (the same discriminator the backend sets — present only on web clips). A **file upload** renders its parsed Markdown, and every mention of one of *that document's* concepts becomes a clickable, hoverable chip that selects the concept in the graph (inline provenance; a dependency-free rehype tree-walk splits text nodes on a name/alias alternation, skipping code spans + links — no char offsets are stored, so matching is by surface form, **boundary-guarded per term so CJK names link too**). A **web clip** instead **embeds its original page** in an `iframe` of `source_url`; the header keeps an "Original ↗" link as the fallback for sites that refuse framing. **Co-present layout (Obsidian's panel stack):** the source text fills the width and a **right rail** holds two stacked panels — the document's **local-graph panel** (`LocalGraphPanel`) on top, the heading **outline** below (the rail is `DocumentReader` chrome; the parent injects the panel via a `localGraph` slot, hidden on narrow widths and for web clips). The thumbnail always shows the document's own concepts as a `GraphCanvas` narrowed via a `restrictToIds` prop — a genuine **sub-graph** (only the doc's concepts plus the edges among them, *not* the full graph with outsiders hidden), so the force sim lays them out as their own compact ball; it runs in `thumbnail` mode (the camera **auto-fits** to fill the small pane, re-fitting on a document switch or resize, and the hover preview card is suppressed as it would overflow). The header carries **two icons** (Obsidian's) that **expand to a fullscreen graph** over the reading area (`WorkspaceView` owns the `absolute inset-0` overlay, gated on `expandedGraphScope`; the topbar, status bar and side panels stay put): **local** ↗ frames just this document's concepts, **global** ↗ the whole workspace graph with the open document's concepts **lit and the rest dimmed** (a `highlightConceptIds` prop — so you can see where the doc sits in the whole graph, rather than every node lit). Both are full-size, with the normal hover preview and zoom chrome. Replaces the old corner mini (`LocalGraphMini` retired). The **outline** stamps ids on the rendered headings (a rehype pass), reads them back from the DOM and scroll-spies them with one `IntersectionObserver`. The graph↔text link is **bidirectional**: clicking a node selects it and scrolls the prose to its first mention (a pulsed `data-concept-id` chip, found via `MutationObserver` so it works the instant a doc opens), and scrolling the prose highlights the concept nearest the top in the graph (`highlightConceptId`, a chip `IntersectionObserver` reporting the top-most visible mention). **Hover preview** (the page-preview analogue) peeks a concept's description + top passages — a radix `HoverCard` on chips, a hand-placed popover on canvas nodes (no per-node DOM to anchor to) — fetched once per concept and module-cached. Selection and reading are decoupled (selecting a concept no longer closes the reader); a document deleted out from under the reader closes it via a derived value (no effect), mirroring `focusedCluster`.
- Collaboration UI: project dashboard + workspace switcher, members / share panel, activity feed + annotation threads.
- Async collaboration by **polling** (~2.5s refresh of graph + activity) — deliberately no WebSocket; a mentor's edits/annotations surface to the student on the next poll.
- BFF layer: Route Handlers call the backend API; ISR caches graph data.
- RAG streaming proxy: a Route Handler relays the backend SSE to the client.
- Upload: request an S3 presigned URL from the backend; client uploads directly to S3.

**Browser extension — Graph Clipper (Chrome MV3, standalone)**
- A separate client shipped to the Chrome Web Store (not deployed on Vercel/Render, no app-core logic). Lets a user clip the page they're reading straight into a workspace graph.
- Four entry points open the same docked side panel: toolbar icon, an in-page **floating button** (`content/fab.ts` — a declared content script that injects a draggable, Shadow-DOM-isolated clip button on every http(s) page; × dismisses it until the page reloads), the right-click menu, and `Ctrl/Cmd+Shift+S`. The floating button's click can't call `chrome.sidePanel.open()` from the page, so it's relayed to the background service worker. The relay alone is unreliable: a worker cold-started by that message opens the panel too late — the user-gesture flag lapses during startup, so `sidePanel.open()` is rejected (the FAB "sometimes did nothing" while the context menu, a gesture delivered straight to the worker, always worked). The button therefore opens a `fab-keepalive` port on _pointerdown_ that wakes and holds the worker warm for the press, so the _pointerup_ `OPEN_PANEL` lands on a live worker inside the gesture window — same shared open path as the context menu.
- Only client-side processing is **main-content extraction → Markdown** (Mozilla Readability strips nav/ads/sidebar/footer; Turndown + GFM keeps headings / lists / tables / code, flattens links to their anchor text, and drops non-math images — full hrefs and decorative image markup are noise the concept extractor never reads and roughly **halve** the payload; **page math (MathML) is pulled to `$…$` / `$$…$$` LaTeX _before_ Readability runs — Readability scores `<math>` as non-content and strips it, so each equation is swapped for a text token first and restored after Markdown conversion, letting formulas survive on technical pages**) plus light **metadata scraping** (author / published date / site / og:image, incl. JSON-LD) — no AI runs in the extension. Selection mode converts only the highlighted HTML.
- Reuses the web app's **Cognito** session: reads the id-token cookie on the app origin and refreshes via Cognito `REFRESH_TOKEN_AUTH` near expiry — no second login.
- Submits clean Markdown + page URL + scraped metadata in one call to `POST /api/imports/clip`; never touches S3 (the backend writes it). Picks/creates a target **workspace** via the existing `/api/workspaces` endpoints.

## 3. Data Model

> All rows belong to a workspace; concepts/chunks carry a pgvector column with an HNSW index. User identity (`owner_id`, `workspace_members.user_id`) is the Cognito `sub`.

**Workspace & collaboration**
- **workspaces**(id, owner_id, type[private|shared], name, icon, icon_color, created_at, updated_at)
- **workspace_members**(workspace_id, user_id, role[owner|editor|commenter|viewer], last_seen_activity_at)
- **workspace_share_links**(id, workspace_id, role, enabled, token, created_by, …) — one reusable, revocable invite link per workspace (email invites were dropped in migration 0008)

**Documents & pipeline**
- **documents**(id, workspace_id, title, source_type, status[pending|parsing|chunking|embedding|extracting|merging|clustering|done|failed], s3_key, error, **summary**, **summary_embedding** vector, **source_url**, **source_url_canonical**, **doc_metadata** jsonb, **body_markdown**, created_at) — `summary`/`summary_embedding` hold the aggregated doc-level summary (added in 0009); `source_url` is the web origin a clipped document came from, null for uploads (0011, provenance); `source_url_canonical` is the normalised URL used as the per-workspace clip **de-dup key** and `doc_metadata` the scraped page metadata (author/date/site/image), both null for uploads (0012); **body_markdown** is the full parsed source (Markdown — PDFs rendered, md/text decoded) kept for the **reading view**, lazily backfilled from S3 on first open for pre-0014 documents (0014)
- **chunks**(id, document_id, content, content_hash, embedding vector)
- **concepts**(id, workspace_id, name, canonical, **origin[extracted|manual]**, description, embedding vector, cluster_id) — a `manual` node is a hand-authored research-direction (question / hypothesis / next step) and carries no embedding
- **concept_aliases**(concept_id, alias) — merged synonyms attach here instead of new nodes; also read on the resolve fast path
- **concept_mentions**(concept_id, chunk_id, document_id) — provenance / citation source
- **edges**(id, workspace_id, source_concept_id, target_concept_id, relation, **kind**, weight) — repeated edges increment weight; `kind` = `relation` (LLM-extracted, shown in the graph) or `cooccur` (same-chunk co-occurrence, a hidden substrate that densifies the cluster graph) (kind added in 0010)
- **clusters**(id, workspace_id, label, **parent_id**) — topic clusters from community detection (LLM label); `parent_id` is the multi-level hierarchy — leaf clusters hold concepts, parents group leaves (added in 0009)

**Review & activity (collaboration)**
- **graph_audit**(id, workspace_id, actor_id, actor_role, action, entity_type, entity_id, before, after, source, undone_by, created_at) — history of HUMAN graph edits for async mentor review + undo (pipeline writes are not audited)
- **annotations**(id, workspace_id, author_id, target_type[concept|edge|cluster], target_concept_id / target_edge_id / target_cluster_label, kind[highlight|flag|comment], body, status[open|resolved], parent_id, …) — mentor notes + comment threads; clusters are referenced by LABEL because cluster ids churn on every recompute

## 4. Logic That MUST Live Server-Side

The following must **not** run on the frontend/client:

- All embedding and LLM calls (OpenAI) — backend only.
- Every stage of the document ingestion pipeline (parse, chunk, embed, extract concepts, core-concept gate, merge/dedup, build edges).
- Clustering / community detection.
- Semantic search (because it first needs to embed the query).
- RAG retrieval + generation + computing cited_concept_ids.
- All Aurora database reads/writes (frontend accesses indirectly via the backend API).
- Auth verification for protected endpoints (backend verifies the Cognito id token via JWKS — no shared secret).
- Human graph edits (create / edit / delete nodes & edges): validated, audited (before/after snapshot for undo), and taken under the **same per-workspace lock** the ingestion worker holds — a concurrent import yields a conflict, never a duplicate node.
- Share-link accept (bind the joining Cognito `sub` to the workspace at the link's role, idempotent) and all role / permission checks.

## 5. Data Flows

### 5.1 Ingestion Pipeline (async, worker)
1. Frontend requests presigned URL → uploads to S3; backend inserts documents=pending, enqueues, returns job id; frontend polls status. Image uploads are rejected up front with **415** (`image/*` content-type or image extension) — the pipeline has no OCR, so an image would otherwise decode to replacement-character garbage on the text path.
2. Parse (PyMuPDF4LLM → layout-aware Markdown for PDF — reconstructs reading order for two-column papers and emits structural headings/tables; direct read for MD/txt). A trailing **References/Bibliography** section is stripped before extraction so cited titles don't each become a junk concept. The parsed Markdown is also stored on `documents.body_markdown` (before chunking) so the reading view can show the original without re-parsing.
3. Chunk (by structure + token window; content hash for idempotency).
4. Embed chunks (OpenAI embedding → write pgvector).
5. Extract concepts + relations (OpenAI structured output, per chunk — high recall; a single passage is deliberately mined exhaustively).
6. **Doc summary:** the extractor emits a one-line summary per chunk; an aggregator LLM folds them into a single document summary, embedded and stored on `documents.summary` (backs document search). This summary is for **search only** — it is no longer the core gate's centrality arbiter (see step 7).
7. **Core-concept gate (reduce-pass salience):** per-chunk extraction is blind to the whole document, so bibliography / related-work passages each yield nodes (noise). Centrality is a **global** property, so one document-level LLM call decides it — never a chunk (a chunk can't know an optimizer it describes is incidental to a paper it never sees). The gate judges each candidate against the document's own **framing** — its title + abstract + introduction + conclusion (`app/services/thesis.py`), taken as fixed front/tail character windows of the parsed text, **not** parsed sections (positional slicing always returns an anchor; heading regexes fail on arbitrary PDF-to-Markdown). The framing, not the aggregate doc summary, is the arbiter: the summary stitches every passage together and so reflects incidental machinery (an optimizer, a normalization trick) as if it were the subject, while the authors' framing names only the contribution. Each candidate carries two signals — `freq` (passage count, a weak hint) and **`grounded`** (its name/alias appears in the framing — a strong core prior, computed deterministically by literal match; it therefore only fires when the framing language matches the English-normalised concept names, i.e. effectively English documents — for a non-English document grounding goes quiet and the model judges the framing text directly, so the prompt is told an absent grounding flag means nothing). The model applies a contribution test (*would the document still stand without this concept?*), leans **drop** when unsure (precision over recall), and returns only the concepts the document substantively develops. Drops are **document-scoped** — a concept another document owns is untouched — and the step is **fail-open** (refusal/empty/empty-framing keeps all candidates, falling back to the doc summary as anchor, never empties the graph). Only the kept concepts are embedded for the next step.
8. **Merge/dedup:** an exact-name **and alias** fast path resolves known surface forms with no LLM call; otherwise embed the concept → pgvector similarity query within the same workspace → an LLM judge (`match_concept`) confirms a match → merge (fold description + re-embed, add alias + mention), else create a new node. The merge section runs under a per-workspace Redis lock so concurrent jobs can't spawn duplicate nodes. The lock's TTL is **tied to the job timeout** (`_JOB_TIMEOUT`, the longest the lock can be held): a shorter TTL would expire while a long merge still holds it under multi-document load, both crashing the lock release and letting a second job acquire it mid-merge — silently breaking this no-duplicate guarantee.
9. Build edges (map to merged ids; if an edge exists, weight++). Edges whose endpoints were dropped by the gate fall away. In the same pass, **co-occurrence edges** (`kind='cooccur'`, undirected, weight = co-mention count) are written for concept pairs that share a chunk — a hidden substrate that densifies the cluster graph (the displayed relations alone are sparse). Weight accumulates across chunks and documents, so repeated co-mention carries strength.
10. **Clustering:** two-level Leiden over the weighted graph — **both** displayed relations and co-occurrence edges (igraph/leidenalg, networkx-Louvain fallback) → big top communities split once into sub-topics → write leaf `cluster_id` + the `parent_id` hierarchy; an orphan concept (no edge at all) is rescued by an embedding-kNN link so it joins a real topic instead of becoming a singleton; an LLM labels each cluster. Recomputed for the whole workspace after each ingest.
11. Finalize: documents=done, notify frontend to refresh.

**Global dedup sweep (repair pass, separate arq job — `dedup_sweep_workspace`).** The per-document merge is greedy and order-dependent: its embedding block can miss a synonym whose vector sits just past the recall floor, and those misses are never revisited. A manually-enqueued (or scheduled) sweep re-blocks every concept against every other (exact cosine), re-runs the same LLM judge, and **merges** confirmed duplicates — folding the loser's mentions, edges, and aliases onto the survivor, then deleting it (the "merge two existing nodes" operation the incremental path never performs). Runs under the same per-workspace lock; `dry_run` judges without writing. Idempotent.

### 5.2 Semantic Search (sync, backend)
1. Embed the query once (OpenAI); an empty query short-circuits to no results, an embed failure surfaces as 503 (not an unhandled 500).
2. pgvector cosine ANN (HNSW) over two corpora, workspace-scoped: `concepts` (named nodes — manual nodes carry no embedding and are skipped) and `chunks` (source passages, joined to their document for the title).
3. Each passage hit carries the concept ids it mentions, so — though a passage is not itself a graph node — a click can route to one.
4. `GET /api/search?q=&workspace_id=&limit=` returns `{concepts[], passages[]}`, each with a cosine-similarity score. The client pairs this vector recall with its own instant substring match over the already-loaded graph (cmdk): concept hits feed the existing select-node path; a passage hit selects its most-mentioned concept (ranked by the mention counts the client already holds).

### 5.3 RAG Q&A (sync, backend)
1. Embed the query (OpenAI).
2. pgvector retrieve top-k chunks + related concepts (scoped to current workspace).
3. Assemble context + concept ids.
4. LLM generate: a citation-backed answer + echo cited_concept_ids, streamed out.
5. Frontend lights up graph nodes by id in real time (no fuzzy text matching).

### 5.4 Collaboration (async, student ↔ mentor)
1. **Share:** an owner enables a reusable, role-scoped share link; a recipient opens `/invite/{token}`, logs in, and is bound to the workspace at that role (idempotent — re-accept never downgrades). Link-only; no email path.
2. **Mentor review:** highlight / flag / comment (threaded) on a concept / edge / cluster — a cluster is referenced by **label**, not id, because cluster ids are rebuilt on every ingest. Notes carry open / resolved status.
3. **Graph edit:** an editor mutates nodes/edges under the per-workspace lock; each change is audit-logged (actor, role, before/after) and reversible via undo.
4. **Sync:** the student's client **polls** (~2.5s) for graph + activity changes; an unread high-water mark badges events by others. No realtime channel by design.
5. **(Planned) Slack:** a two-way plugin (OAuth) posts changes / digests outbound and accepts slash-command / button actions inbound — roadmap (M4–M5), not yet built; needs HMAC webhook verification + encrypted bot-token storage.

### 5.5 Web Clip (browser extension → same pipeline)
A second ingestion entrypoint alongside file upload, for the page a user is reading.
1. The extension extracts the page's main content as **Markdown** (Readability → Turndown) and scrapes page **metadata** client-side, then shows a preview (with a soft "long page" warning past ~50k chars); the user edits the title, toggles whole-page / selection, and picks or creates a target workspace.
2. On confirm it `POST`s `{title, content, source_url, metadata, workspace_id?}` to **`/api/imports/clip`** with the reused Cognito id token. Access control is identical to upload (personal workspace by default, else owner/editor of the target). An oversized body (> `clip_max_chars`, default 300k) is rejected with 413.
3. The backend first **de-dups** by canonical URL (`services/urls.normalize_url` → `documents.source_url_canonical`): a page already clipped into the workspace returns the existing document (`duplicate: true`, no S3 write, no job). Otherwise it writes the Markdown to S3 itself (`put_object`), inserts `documents=pending` (`source_type="markdown"`, with `source_url` / canonical / metadata set), and enqueues the **same** `ingest_document` job via the shared `persist_and_enqueue_document` tail, so the worker (§5.1 steps 2–11) is unchanged. A *related* (not identical) page still merges its concepts into the graph like an uploaded document, bumping mention counts instead of duplicating nodes.
4. No graph push from the extension — the open web app's existing ~2.5s poll surfaces the new nodes once the document reaches `done`. Empty content (the "save link only" fallback) records `source_url` with no concepts and deliberately does **not** claim the canonical key, so a later successful clip of the same page can still ingest.

## 6. Deployment & CICD
- **Frontend:** Vercel connected to GitHub, Root Directory = `frontend`, env vars in project settings; push auto-deploys + PR previews.
- **Backend:** created directly in the Render dashboard (no render.yaml, no Docker) —
  - Web Service: Python, Root `backend`, Build `pip install -r requirements.txt`, Start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, Starter.
  - Background Worker: Start `arq app.worker.WorkerSettings`, Starter (Free does not support workers).
  - Key Value: maxmemory policy = noeviction.
  - Env vars: DATABASE_URL, OPENAI_API_KEY, REDIS_URL, COGNITO_REGION, COGNITO_USER_POOL_ID, COGNITO_APP_CLIENT_ID.
  - `backend/.python-version` pins the Python version. Push auto-deploys.
- **Database:** Aurora PostgreSQL set publicly accessible; security group allowlists Render's regional egress IPs (port 5432).
- Repo is a monorepo: top-level `frontend/` + `backend/`.

## 7. Dev Tooling
- **awslabs Aurora PostgreSQL MCP server** (postgres-mcp-server): a dev-time tool letting an IDE-embedded LLM build tables / validate / debug SQL directly against Aurora. Requires RDS Data API enabled on the cluster + a Secrets Manager secret + local AWS credentials; read-only by default, writes need `--allow_write_query`. **Not part of the production path** (runtime still uses SQLAlchemy/asyncpg).
