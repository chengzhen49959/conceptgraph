# PROJECT STATE (English)

Updated: 2026-06-18

## 1. Where We Are Now

**Done (planning & decisions):**
- Product defined: an auto-growing, auto-deduplicating concept-graph knowledge base (see prd.md).
- Tech stack:
  - Frontend Next.js (Vercel)
  - Backend FastAPI (Render, native Python, no Docker)
  - Database Aurora PostgreSQL + pgvector (AWS)
  - Embedding + LLM: OpenAI Python SDK, backend only
  - Graph viz: react-force-graph
  - Auth: **Amazon Cognito** (via AWS Amplify) — pivoted from Clerk
  - Async: arq worker + Redis (Render Key Value)
  - Clustering: Python (leidenalg/igraph or HDBSCAN/UMAP)
- Architecture layers and server-side responsibilities defined (see arc.md): all AI + heavy processing on the backend; all DB access via the backend; Vercel does not connect to Aurora directly.
- Two core pipelines designed: ingestion (incl. merge/dedup and clustering) and RAG Q&A (incl. real-time highlight).
- Data model / table schema drafted (see arc.md §3).
- Dev tooling: awslabs Aurora PostgreSQL MCP server (scaffolded in `.mcp.json`).

**Done (code — auth & data foundation):**
- **Auth works end to end on Cognito** (pivoted from Clerk):
  - Backend verifies the Cognito **id token** locally against the User Pool JWKS — no per-request round-trip to AWS (`backend/app/cognito.py`, `backend/app/auth.py`).
  - Settings via pydantic-settings (`backend/app/config.py`): Cognito region / pool / client IDs + `DATABASE_URL` + `FRONTEND_ORIGIN`.
  - Async SQLAlchemy 2.0 + asyncpg DB layer with a pooled engine and a `get_session` dependency (`backend/app/db.py`).
  - Alembic async migration infra wired to `Base.metadata` (`backend/alembic.ini`, `backend/migrations/env.py`).
  - Endpoints: `GET /api/health` (public) and `GET /api/me` (returns the caller's Cognito identity from the verified token).
- **Frontend Amplify auth UI:**
  - Landing, login, signup (email-code confirm + autoSignIn), dashboard (server-side auth guard).
  - `src/proxy.ts` route guard redirects unauthenticated users to `/login`.
  - Server + client API clients forward the Cognito **idToken** as a Bearer to FastAPI (`src/lib/api.ts`, `src/lib/api-server.ts`).
- Supabase fully removed (no residue in either app).

**Not started (product code):**
- No application data yet — `/api/me` only echoes the token; the `get_session` dependency is unused by any router.
- Data model not created: `backend/app/models.py` has only an empty `Base`; `backend/migrations/versions/` is empty (no migration generated).
- Database not provisioned: no Aurora cluster, pgvector not enabled, no tables, no HNSW indexes.
- No ingestion pipeline (parse → chunk → embed → extract concepts → merge/dedup → build edges → clustering).
- No OpenAI integration (embeddings / LLM), no RAG endpoint, no real-time highlight.
- No graph viz (react-force-graph), no concept detail / search / Q&A UI.
- No async stack: arq worker + Redis not set up; no S3 upload (presigned URL).
- Deployment chain not validated end to end (Render web + worker + Key Value; Vercel frontend).
- `.mcp.json` still has unfilled `<...>` placeholders (cluster ARN, secret ARN, region, profile); aws CLI not installed locally.

## 2. Issues / Risks
- **Auth pivot Clerk → Cognito:** the code uses Cognito (Amplify) while earlier drafts named Clerk. prd.md / arc.md are now reconciled to Cognito — the backend verifies the Cognito id token via JWKS (no shared secret), and the frontend uses Amplify cookie-based SSR sessions.
- **Scope vs deadline:** only the auth foundation is built; the entire product pipeline (import + merge + clustering + viz + RAG) remains, and the deadline is 2026-06-29. Recommend cutting collaboration (F10) to a minimal version or v2 and focusing on the single-user F2–F9 loop.
- **Merge/dedup is make-or-break:** the core differentiator and biggest risk; quality depends on similarity-threshold tuning (optional LLM second check). It must be the hero of the demo.
- **Originality risk:** the "chat with PDF + knowledge graph" space is crowded; differentiation must come from auto-merge / auto-grow / real-time highlight.
- **Aurora not provisioned:** no cluster, no pgvector, no tables — this blocks all data work. Networking: must add Render egress IPs to the security group (Vercel does not connect to Aurora directly).
- **Cost:** Render workers can't use Free (needs Starter); Free Web spins down — use Starter for the demo.

## 3. Next Steps (in order)
1. **Provision Aurora PostgreSQL** on AWS and enable pgvector (for the MCP: also enable the RDS Data API + create a Secrets Manager secret, then fill the `.mcp.json` placeholders).
2. **Define the data model** in `backend/app/models.py` and generate the **first Alembic migration** (workspaces, workspace_members, documents, chunks, concepts, concept_aliases, concept_mentions, edges, clusters) with pgvector columns + HNSW indexes, then `alembic upgrade head`.
3. **Validate the deploy chain first:** Render Web boots and passes the `/api/health` check; Vercel deploys the frontend; confirm auth works against the deployed Cognito User Pool.
4. Implement the ingestion pipeline stages (parse → chunk → embed → extract concepts → merge/dedup → build edges → clustering) on an arq worker + Redis.
5. Implement the RAG endpoint (retrieve + generate + cited_concept_ids, streamed).
6. Build the frontend product UI (graph view, import, concept detail, search, Q&A with highlight).
7. Prepare deliverables: demo video, architecture diagram, AWS database usage screenshot, Vercel link + Team ID.

## 4. Key Dates
- Submission deadline: 2026-06-29 17:00 PT (2026-06-30 08:00 GMT+8).
- AWS/v0 credits request form: by 2026-06-26 12:00 PT.
- Judging: 06-30 to 07-24; results: ~07-31.
