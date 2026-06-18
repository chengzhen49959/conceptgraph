# Next.js + FastAPI + AWS Starter

Full-stack starter with authentication wired end to end.

- **Frontend** — Next.js 16, Tailwind v4, shadcn/ui, lucide-react, Zustand
- **Backend** — FastAPI (managed with [uv](https://docs.astral.sh/uv/))
- **Auth** — Amazon Cognito (via AWS Amplify)
- **Database** — Amazon Aurora PostgreSQL (SQLAlchemy async + Alembic)

The browser authenticates with Cognito directly (Amplify). For data, it calls
FastAPI with the Cognito **id token**, which FastAPI verifies locally against the
User Pool's public keys (JWKS) — no per-request round-trip to AWS.

## Prerequisites

- Node.js 20+
- Python 3.12+ and [`uv`](https://docs.astral.sh/uv/getting-started/installation/)
- An AWS account (Cognito User Pool + Aurora cluster)

## Setup

1. **Create a Cognito User Pool.** Add an **App client** with no client secret and
   `ALLOW_USER_PASSWORD_AUTH` enabled. Use email as the sign-in alias. Note the
   **User Pool ID**, **App client ID**, and region.

2. **Create an Aurora PostgreSQL cluster.** Grab a connection URL for the backend
   (`postgresql+asyncpg://user:pass@host:5432/dbname`). For the Aurora MCP server
   (below), enable the **RDS Data API** and store the DB credentials in a Secrets
   Manager secret.

3. **Configure env:**

   ```bash
   cp frontend/.env.example frontend/.env.local         # Cognito pool + client ID
   cp backend/.env.example backend/.env.local           # Cognito + DATABASE_URL
   ```

   The Cognito IDs are browser-safe. `DATABASE_URL` is backend-only — never commit it.

4. **Install and run:**

   ```bash
   npm install && npm run setup
   npm run dev
   ```

   Frontend on http://localhost:3000, backend docs on http://127.0.0.1:8000/docs.

5. **Database migrations** (when you add tables under `backend/app/models.py`):

   ```bash
   cd backend
   uv run alembic revision --autogenerate -m "create users"
   uv run alembic upgrade head
   ```

## Aurora MCP server

`.mcp.json` wires the [`awslabs.postgres-mcp-server`](https://awslabs.github.io/mcp/servers/postgres-mcp-server)
so Claude Code can query Aurora over the RDS Data API. Fill in the `<...>`
placeholders (cluster ARN, secret ARN, region, AWS profile), then restart Claude
Code and run `/mcp` to confirm `aurora-postgres` connects. Requires the AWS CLI
configured with `rds-data` + `secretsmanager:GetSecretValue` permissions.

## Layout

```
frontend/   Next.js — Cognito/Amplify auth UI, dashboard, API clients, shadcn/ui
backend/    FastAPI — Cognito JWT verify, Aurora (SQLAlchemy), Alembic, /api/health, /api/me
.mcp.json   Aurora Postgres MCP server (RDS Data API)
```

## Use as a template

```bash
gh repo create my-app --template YOUR-NAME/starter-template --private --clone
```

Then rename in `package.json`, `frontend/package.json`, `backend/pyproject.toml`,
`backend/app/main.py` (FastAPI title), and `frontend/src/app/layout.tsx` (metadata).
