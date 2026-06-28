# PRD — Collaborative Research Concept-Graph (English)

## 1. Overview
A collaboration platform where **student researchers** turn their reading (PDF / Markdown / text) into an **auto-growing, auto-deduplicating concept graph**, and a **mentor / advisor reviews that graph asynchronously**. Flow: import documents → concepts are auto-extracted and synonymous concepts merged across documents → graph visualization + semantic search + RAG Q&A grounded in the library, with the concepts an answer relies on highlighted live. On top of the graph a student can hand-author **research-direction nodes** (question / hypothesis / next step); a mentor can **highlight** promising directions, **flag** wrong ones, **comment** in threads, and **edit the graph directly** — every human edit is audit-logged and undoable. Each user has a private personal workspace; shared **project** workspaces are joined by a reusable link with per-member roles.

## 2. Background & Problem
A student researcher reading a pile of papers is left with isolated notes and PDFs: the same concept recurs across documents but is never merged, relationships between concepts are invisible, and there is no way to "ask the library for answers." Worse, the **mentor** guiding that student has no shared, structured view of where the student's thinking is heading — feedback happens over scattered docs and meetings, lossily and out of band. Existing tools are either linear notes (Notion / Obsidian) or pure search (enterprise search); neither auto-structures knowledge into a growing concept network, and none make a research *direction* reviewable by an advisor.

## 3. Target Users
- **Student researchers** (grad / undergrad) building a literature-grounded research direction.
- **Mentors / advisors** reviewing and steering that direction asynchronously.
- More broadly, knowledge-intensive teams (consulting, legal) co-building a domain concept graph.

## 4. Product Goals
- After importing a document, concepts enter the store automatically and merge correctly with existing concepts — no manual dedup.
- A student sees concept relationships and provenance, and can lay out their own research-direction nodes on the same graph.
- A mentor reviews the graph asynchronously — highlight / flag / comment, or edit nodes & edges directly — with every change logged and undoable.
- Users can ask the library directly and get cited answers, with related concepts lit up on the graph.
- Several people co-build one project graph via a shared workspace + roles, while each person's personal workspace stays private.

## 5. Feature List (each with acceptance criteria)

> Status tags: **[built]** working in code · **[partial]** foundation present · **[planned]** roadmap, not yet built. See `project_state.md` for the authoritative status.

### Core knowledge loop (single-user)

### F1 Account & Auth **[built]**
Sign-up / sign-in (Amazon Cognito via AWS Amplify).
**Done when:** users can register and log in via Cognito (Amplify), confirming sign-up with an emailed verification code; unauthenticated users cannot access any workspace data; after login the user lands in their own private personal workspace.

### F2 Document Import **[built]**
Upload PDF / Markdown / text — **one file or many at once** — triggering an async processing pipeline. Images are rejected at upload (415) — there is no OCR, so they carry no extractable text.
**Done when:** upload returns immediately and shows progress — the documents list shows the **live ingest stage** (parsing → embedding → extracting → merging → clustering → ready) while it processes, not just a spinner; once the pipeline finishes, the document's concepts appear on the graph and status flips to done; **selecting several files imports them all in one action, each ingesting independently so one bad file fails only itself, and they merge into one graph through the same pipeline**; large files (e.g., a 20MB PDF) do not block or time out, and ingestion only starts **after** the file finishes uploading to S3 — a big or slow upload never fails with a spurious "file not found" because the worker raced ahead of the bytes; uploading an image returns a clear "not supported" error instead of silently producing a garbage node; **a document that fails ingest (network blip, parse error) shows the failure reason inline with a clear "delete & re-upload to retry" instruction and a one-click delete — ingest isn't resumed in place, so recovery is always delete + re-upload.**

### F3 Automatic Concept Extraction **[built]**
Extract concepts and their relationships from document chunks, then keep only the concepts the document is **substantively about**: per-chunk extraction runs at **pure recall** (it surfaces every named concept it sees, since a single passage can't know what is central), and a document-level core-concept gate then drops incidental mentions (prior work cited once, datasets / metrics named in passing) so the graph isn't flooded with noise. The gate judges centrality against the document's own **framing** (its title + abstract + introduction + conclusion) rather than an aggregate summary of every passage — so a tool the document merely *uses* (an optimizer, a normalization trick) is not mistaken for a topic the document is *about*. A **survey or review** is the exception the gate detects: its contribution is to map a whole field, so it keeps the many named sub-areas the survey covers (not just its section headings), dropping only datasets / benchmarks / tools named in passing.
**Done when:** after a document is processed, its core concept nodes and relationship edges appear on the graph, each concept traces back to its source chunk, and one-off background mentions (e.g. a paper cited once in related work) do **not** become nodes. PDF-extraction artefacts are removed before extraction — figure/formula placeholders and the OCR'd text of chart axes/legends (the noise PyMuPDF4LLM's layout engine injects, which no parser flag suppresses) do **not** become junk concepts or pollute embeddings.

### F4 Cross-Document Auto-Merge / Dedup (core differentiator) **[built]**
A new concept is matched against existing concepts: an exact name or a recorded alias resolves instantly with no LLM call; otherwise semantic similarity plus an LLM judge decide. If judged the same it is merged (alias + provenance, with the description folded in) rather than creating a new node. A **global dedup sweep** (separate repair job) re-checks every concept pair against the same judge to catch near-duplicates the greedy incremental merge missed, folding two existing nodes into one; it offers a `dry_run` preview and is idempotent. An interrupted ingest can strand a created node before its mentions are written (node-create and provenance are separate transactions), so each ingest and each document-delete **reconciles** the workspace — extracted concepts no document mentions are swept (manual nodes exempt), so a failed import never leaves a ghost node that has no document, topic, or edge behind it.
**Done when:** importing a second document containing the same concept produces **no duplicate node** — instead the original node's provenance/mention count increases (demoable live). False-merge rate stays acceptable (tunable threshold + LLM confirmation). Running the sweep on a workspace with known split duplicates reduces the node count without losing any mentions or edges.

### F5 Graph Visualization **[built]**
Force-directed graph of concept nodes and edges, colored by cluster.
**Done when:** the graph renders all concepts/edges in the current workspace; nodes are colored by cluster; zoom/drag/select work; clicking a topic in the sidebar focuses its cluster on the canvas (persistent highlight + zoom) and the sidebar's topic + concept colours match their canvas nodes; **selecting a concept anywhere reveals it in the sidebar** (its topic expands, its row scrolls into view and highlights); selecting a node centres it (+ its neighbours) in the visible area keeping the zoom (zoom in afterwards and it stays centred on the node), and **deselecting zooms back out and recentres** on the whole-graph overview (clicking empty space pops the view back out, it doesn't stay zoomed in); the node right-click menu stays **inside the viewport** near an edge; interaction stays smooth at hundreds of nodes (label de-overlap is O(n) — off-screen labels culled, the rest de-conflicted via a spatial-hash grid); while the graph is still fetching the canvas shows a **loading** state, and a failed fetch shows an **error + Retry** — never a false "your graph is empty" that reads as data loss.

### F6 Concept Detail **[built]**
Click a node to see name, aliases, description, source documents, related concepts.
**Done when:** clicking any node opens a detail view listing all its aliases, linked source documents/passages, and directly connected concepts, with clickable provenance.

### F7 Semantic Search **[built]**
Retrieve concepts and document passages by meaning.
**Done when:** a query returns relevance-ranked concept/passage results scoped to the current workspace; matching is driven by vector similarity, not pure keywords. *Shipped: `GET /api/search` embeds the query and runs pgvector cosine ANN over concepts + chunks; the search palette layers this vector recall over its instant client-side substring match — concept hits jump to the node, passage hits jump to their most-mentioned concept.*

### F8 RAG Q&A + Real-Time Highlight **[built]**
Answer from library knowledge, with citations, lighting up the concepts the answer relies on.
**Done when:** a question yields a streamed, citation-backed answer; as the answer streams, the concept nodes it relies on light up on the graph in real time (driven by backend-returned concept_id, not fuzzy text matching). *Shipped: `POST /api/ask` (SSE) embeds the question and runs the same pgvector cosine ANN over the workspace's `chunks` (top-k 8) as `/api/search`, assembles a numbered context block, and streams a citation-backed answer that cites passages as `[n]`; `cited_concept_ids` is the union of the cited passages' concept ids (deterministic, by id — never fuzzy text). The Q&A surface is the ⌘K palette's **Ask** mode (not a separate panel): typing shows an "Ask the library" affordance, and the streamed answer renders inline `[n]` chips, a Sources list, and "Concepts cited" chips while WorkspaceView lights those concepts on the graph live via the existing `GraphCanvas.highlightConceptIds` prop, settling on the `done` set.*

### F9 Automatic Clustering (topic hierarchy) **[built]**
Run community detection over the concept graph to form named topic clusters, organized into a topic → sub-topic hierarchy. The graph is densified with **co-occurrence edges** (concept pairs sharing a chunk) so communities form on real co-mention rather than only the sparse set of explicitly-extracted relations.
**Done when:** concepts are assigned to topic clusters reflected as graph coloring; each cluster has an auto-generated label; large topics split into sub-topics (parent/leaf); a concept with no relation is folded into the nearest topic by similarity rather than left as noise; clustering updates after new documents are imported.

### F10 Document Summary **[built]**
Each imported document gets an auto-generated summary, aggregated from its chunks.
**Done when:** after processing, the document's card / detail shows a concise generated summary of the whole document; the summary is also embedded and stored, laying the foundation for searching documents by summary (feeds F7).

### Collaboration layer (student ↔ mentor)

### F11 Projects & Dashboard (multi-workspace) **[built]**
Each user has one private personal workspace plus any number of shared **project** workspaces, isolated from each other, with a dashboard overview.
**Done when:** a user sees a dashboard of their projects (icon, name, last-activity) and can create / open / switch projects; data in one workspace never leaks into another; the personal workspace is always private. (A unified cross-project meta-graph is explicitly **deferred** to a later version.)

### F12 Share & Roles **[built]**
Invite collaborators to a project via a single reusable share link, with per-member roles.
**Done when:** an owner can enable a share link, pick the role it grants, copy it, and revoke it (toggle off / rotate token); anyone who opens the link and logs in joins the project at that role. Roles: **owner** (full) / **editor** (edit graph + annotate) / **commenter** (comment only) / **viewer** (read only). No email is required (link-only). *(External recipients require `FRONTEND_ORIGIN` to point at a deployed URL.)*

### F13 Graph Editing + History (mentor can edit) **[built]**
Members with edit rights can author and change the graph by hand — including **research-direction nodes** (question / hypothesis / next step) that carry no embedding and never merge — with full history.
**Done when:** an editor can create / edit / delete concept nodes and edges on the canvas; every human edit is recorded in an audit log (who, role, before/after) and can be **undone**; manual edits take the same per-workspace lock as the ingestion worker so they can't race a running import (contention returns a clear conflict, not a duplicate).

### F14 Async Mentor Review (annotations + activity) **[built]**
A mentor reviews the student's graph asynchronously and leaves structured feedback.
**Done when:** a reviewer can **highlight** a promising node, **flag** a wrong direction, or **comment** (threaded replies) on a concept / edge / cluster; notes have an open / resolved status; an **activity feed** shows recent changes with a per-member unread badge; the student sees updates by polling (existing ~2.5s poll — **async, no realtime/WebSocket** by design). Highlight/flag are restricted to owner/mentor roles.

### F15 Slack Integration **[planned]**
Two-way Slack plugin so a mentor can follow and act on a project without opening the app.
**Done when:** a project can connect Slack via OAuth; **outbound** — graph changes / flags / digests post to a channel; **inbound** — slash commands and message buttons act back on the graph (e.g., resolve a flag, open a node). *(Roadmap milestones M4–M5; not yet built. Requires HMAC webhook verification + encrypted bot-token storage.)*

### F16 Web Clipper (browser extension) **[built]**
A standalone Chrome (MV3) extension that clips the page a user is reading into a workspace graph, through the **same** ingest pipeline as upload — so a clip auto-merges/de-dups across the library like any document. Main-content extraction to **Markdown** (Readability → Turndown, structure preserved) plus page-**metadata** scraping are the only client-side steps; no AI runs in the extension. Reuses the web app's Cognito session (no second login). The clipper is a docked **side panel** (not a popup) that **renders** the clipped Markdown as a reader-view preview — headings / lists / tables / KaTeX math — rather than showing raw markdown text. Opened from any of four entry points: the toolbar icon, an in-page **floating button** (auto-injected, draggable, dismissible per page), the right-click menu, or `Ctrl/Cmd+Shift+S`.
**Done when:** on a text page (news / blog / docs / paper) the panel extracts the main content as **Markdown** (no nav / ads / sidebar; headings / lists / tables kept, **math captured as `$…$` / `$$…$$` LaTeX**, links flattened to their text and non-math images dropped to cut noise) and previews it; the user can clip the whole page **or only a selection**, edit the title, and choose an existing workspace **or create one on the spot**; confirming sends the Markdown + `source_url` + scraped metadata into the pipeline and returns a document/job id; the clipped page's concepts appear in that workspace's graph; **re-clipping the same page returns the existing document** (de-duped by canonical URL) while a *related* page still **merges** concepts (mention count up) rather than duplicating nodes; an oversized page is rejected with a clear message; extraction failure still allows **saving the link only**; an unauthenticated user is guided to sign in. Scope: single page, user-triggered — no automatic batch crawling.

### F17 Source File View **[built]**
Reach a document's *original source* — what the user actually provided, not a re-render — **directly from its sidebar row**. Clicking a row **opens** its source (a file upload inline, a web clip its origin page); **Download** (uploads only) and **Delete** sit on the row's hover **⋯** button and right-click menu — one operation model shared with topic and concept rows. There is no in-app reader and no main-area view — the canvas stays on the graph, and the user reaches the real source from one row. *(This replaced an Obsidian-style reading pane that rendered parsed prose with inline concept chips, a per-document local graph, a heading outline and bidirectional graph↔text scroll-sync; that surface was removed as excess complexity in favour of just opening the source file.)*
**Done when:** clicking a document row **opens its source**, with **Download** (uploads only) + **Delete** on its hover **⋯** / right-click menu; **Open** shows an **uploaded file** (no `source_url`) inline in a new tab — no orphaned blank tab — and a **web clip** (has `source_url`) at its origin page; **Download** saves the original to local (forced via `Content-Disposition: attachment`, non-ASCII/CJK filenames preserved) with a toast so the save is acknowledged; both file URLs are short-lived **presigned S3 URLs fetched on click** (never stale); the concept panel's Sources list opens a document's source the same way; the graph canvas is never replaced.

### F18 MCP Server — AI External Memory **[built]**
Let a student connect their **own** AI client (Claude / ChatGPT / Cursor) to the knowledge base over the Model Context Protocol, using it as the AI's **external memory**: the AI can search the library, ask grounded/cited questions, browse the concept graph, and save new notes back. A remote (hosted) Streamable-HTTP MCP server is mounted at `/mcp`; the AI authenticates via **OAuth 2.1 with Cognito as the Authorization Server** (so it is the student's own account/workspace), or — for clients that prefer it — by pasting a long-lived **Personal Access Token** (Claude Desktop / Cursor via `mcp-remote`), which skips the browser OAuth flow. Tools (all invoked by the agent from chat — there is no inline UI): `memory_search`, `memory_ask`, `graph_get`, `concept_get`, `memory_write`. (An inline graph App was built then removed 2026-06-28 — it rendered poorly in the host and Claude can describe the graph from `graph_get`/`concept_get` data anyway.)
**Done when:** an MCP client completes the OAuth dance against Cognito and lists the tools; `memory_search`/`memory_ask`/`graph_get`/`concept_get` return data scoped to the caller's workspace; `memory_write` queues a note into the ingest pipeline (write scope required); an unauthenticated call gets `401` with the discovery header. *(Verified end-to-end with a real Cognito access token: 401-without-token, initialize, tools/list, tools/call.)*

> Scope note: the single-user core loop is F1–F10 (plus F16, the web-clip ingestion client); the collaboration layer is F11–F15; F18 exposes the core loop to external AI clients. F15 (Slack) is the sole remaining unbuilt piece; F7 (semantic search) and F8 (RAG Q&A) are now built.

## 6. User Flows
1. **Onboarding:** sign up/in → land in personal private workspace → see the project dashboard.
2. **Import:** upload a document → watch progress → graph grows new nodes, or an existing node gains a mention → the document gains a summary.
2b. **Clip (browser extension):** while reading a web page, click the clipper → preview the extracted Markdown (or a selection) → pick or create a target workspace → confirm → the page enters the same pipeline (tagged with its URL + scraped metadata) and its nodes appear in that workspace's graph, merging with what's already there (re-clipping the same page de-dups to the existing document).
3. **Explore:** click a node → view detail and provenance → navigate relationships.
4. **Direct research:** add manual research-direction nodes (question / hypothesis / next step) onto the graph.
5. **Search & ask:** semantic search → relevant concepts/passages; ask the library → streamed, cited answer → related concepts light up live.
6. **Collaborate (student):** create a project → enable a share link → send it to a mentor.
7. **Review (mentor):** open the shared project → highlight / flag / comment, or edit nodes & edges directly → student sees it on next poll, with an activity badge; either side can undo a graph edit.

## 7. Page List
- Sign-in / Sign-up page (Cognito via Amplify)
- **Project dashboard** (project cards: icon, name, last activity) + workspace switcher (personal + shared)
- Main graph view (force-directed canvas, nodes/edges colored by cluster; sidebar controls; edit toolbar; right-click menu)
- Import panel (upload + processing progress)
- Document list page (with per-document summary)
- Concept detail drawer (name/aliases/description/provenance/related concepts)
- Semantic search box (within the main view)
- Q&A — the ⌘K search palette's **Ask** mode (ask + streamed cited answer with inline `[n]` citations + Sources list + concepts-cited chips, synced with graph highlight), not a separate panel
- **Members / share panel** (share-link toggle + role + Copy link)
- **Activity feed** (recent changes + unread badge; annotation threads)
- **Browser-extension clip panel** (Markdown preview + whole-page/selection toggle + title edit + workspace picker with inline create; long-page warning + "already clipped" state) — separate Chrome extension, not a web page

## 8. Hackathon Constraints & Deliverables (reference)
- Mandatory: use Aurora PostgreSQL (one of the three required DBs) as the primary backend; deploy the frontend on Vercel.
- Deliverables: <3-min public demo video (problem/audience/DB used + working footage), published Vercel project link + Vercel Team ID, architecture diagram, screenshot proving AWS database usage, English text description.
- Key dates: submission deadline 2026-06-29 17:00 PT; credits request form by 2026-06-26 12:00 PT.
- Bonus: publish content on how you built it, 0.2 each up to 0.6, stating it was created for this hackathon, with #H0Hackathon on social media.
