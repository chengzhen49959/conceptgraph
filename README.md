# Next.js + FastAPI + Supabase Starter

Full-stack starter with authentication wired end to end.

- **Frontend** — Next.js 16, Tailwind v4, shadcn/ui, lucide-react, Zustand
- **Backend** — FastAPI (managed with [uv](https://docs.astral.sh/uv/))
- **Auth + DB** — Supabase (hosted)

The browser authenticates with Supabase directly. For data, it calls FastAPI with
the Supabase access token, which FastAPI validates against Supabase per request.

## Prerequisites

- Node.js 20+
- Python 3.12+ and [`uv`](https://docs.astral.sh/uv/getting-started/installation/)
- A [Supabase](https://supabase.com) account

## Setup

1. **Create a Supabase project.** From **Settings → API**, copy the Project URL,
   the **publishable** key (frontend), and the **secret** key (backend). Under
   **Authentication → Providers → Email**, turn off "Confirm email" for instant
   local sign-up.

2. **Configure env:**

   ```bash
   cp frontend/.env.local.example frontend/.env.local
   cp backend/.env.example backend/.env
   ```

   The publishable key is browser-safe. The secret key bypasses Row Level
   Security — backend only, never commit it.

3. **Install and run:**

   ```bash
   npm install && npm run setup
   npm run dev
   ```

   Frontend on http://localhost:3000, backend docs on http://127.0.0.1:8000/docs.

## Layout

```
frontend/   Next.js — auth UI, dashboard, Supabase + API clients, shadcn/ui, store
backend/    FastAPI — token validation, /api/health, /api/me
supabase/   SQL migrations
```

## Use as a template

```bash
gh repo create my-app --template YOUR-NAME/starter-template --private --clone
```

Then rename in `package.json`, `frontend/package.json`, `backend/pyproject.toml`,
`backend/app/main.py` (FastAPI title), and `frontend/src/app/layout.tsx` (metadata).
