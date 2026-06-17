# Backend (FastAPI)

FastAPI service for the starter template, managed with [uv](https://docs.astral.sh/uv/).

```bash
uv sync                                       # install dependencies
cp .env.example .env                          # then fill in Supabase URL + secret key
uv run uvicorn app.main:app --reload --port 8000
```

Endpoints:

- `GET /api/health` — liveness (public)
- `GET /api/me` — caller's Supabase identity; requires `Authorization: Bearer <token>`
- Interactive docs — http://127.0.0.1:8000/docs

See the repository root `README.md` for full setup.
