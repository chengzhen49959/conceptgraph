# Deploy — Frontend on Vercel, Backend on Render

Architecture: **Next.js (Vercel)** → **FastAPI API + arq worker (Render)** →
Aurora Postgres + Redis + S3 + OpenAI + Cognito.

```
Browser ──HTTPS──> Vercel (Next.js)
                      │  NEXT_PUBLIC_API_URL
                      ▼
                   Render: concept-graph-api (uvicorn)  ──┐
                   Render: concept-graph-worker (arq)   ──┤
                   Render: concept-graph-redis (KeyValue)─┘
                      │
                      ├─> Aurora Postgres (existing, us-east-1)
                      ├─> S3 bucket (presigned uploads)
                      ├─> OpenAI API
                      └─> Cognito (JWT verify)
```

The repo is preconfigured: `render.yaml` (Blueprint) defines both backend
processes plus Redis; Vercel auto-detects the Next.js app.

---

## 1. Backend → Render

1. **New > Blueprint**, connect this GitHub repo. Render reads `render.yaml` and
   proposes: `concept-graph-api` (web), `concept-graph-worker` (worker),
   `concept-graph-redis` (Key Value).
2. Fill the **`backend-secrets`** env group (values marked `sync: false`):

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | `postgresql+asyncpg://USER:PASS@hackathon-aurora.cluster-ckdugmcuktuq.us-east-1.rds.amazonaws.com:5432/DBNAME` |
   | `COGNITO_USER_POOL_ID` | from `backend/.env.local` |
   | `COGNITO_APP_CLIENT_ID` | from `backend/.env.local` |
   | `OPENAI_API_KEY` | from `backend/.env.local` |
   | `S3_BUCKET` | from `backend/.env.local` |
   | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | from `backend/.env.local` |
   | `FRONTEND_ORIGIN` | **set after step 2** to the Vercel URL |
   | `EXTENSION_ORIGINS` | optional, from `backend/.env.local` |

   `COGNITO_REGION`, `AWS_REGION` default to `us-east-1`; `REDIS_URL` is wired
   automatically from the Key Value store.

3. **Whitelist Render's egress IPs on Aurora.** Aurora is publicly reachable but
   its security group `sg-0715421ffa5971eed` only allows two home IPs today.
   Copy the web service's **static outbound IPs** (Render → service → *Connect*
   → *Outbound*) and tell me — I'll add them to the SG (5432) via boto3. Without
   this the pre-deploy `alembic upgrade head` fails to connect.

4. Deploy. The web service runs migrations pre-deploy and serves at
   `https://concept-graph-api.onrender.com`. Health: `/api/health`.

---

## 2. Frontend → Vercel

1. **Add New > Project**, import this repo, set **Root Directory = `frontend`**
   (monorepo). Framework auto-detects as Next.js; leave build/output defaults.
2. Environment variables:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | the Render web URL, e.g. `https://concept-graph-api.onrender.com` |
   | `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | from `frontend/.env.local` |
   | `NEXT_PUBLIC_COGNITO_CLIENT_ID` | from `frontend/.env.local` |

3. Deploy → note the Vercel URL.

---

## 3. Wire the two together (after both are live)

- Set Render `FRONTEND_ORIGIN` = the Vercel URL → redeploy web (fixes CORS).
- **S3 CORS**: the bucket must allow `PUT`/`GET` from the Vercel origin for
  browser uploads. Give me the Vercel URL — I'll apply the CORS policy via boto3.

---

## Notes

- **Cost**: web + worker are Render `starter` (~$7/mo each; no free worker tier).
  Redis is `free` (25 MB — enough for the arq queue). The web plan can drop to
  `free` for a demo (cold starts).
- **Python**: pinned by `backend/.python-version` (3.12); deps via `uv sync
  --frozen`.
- **Migrations** run automatically on every web deploy (`preDeployCommand`).
