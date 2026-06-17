from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import health, me


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fail fast if Supabase isn't configured.
    settings = get_settings()
    assert settings.supabase_url and settings.supabase_secret_key, (
        "Supabase not configured — copy backend/.env.example to backend/.env "
        "and fill in your project URL and secret key."
    )
    yield


app = FastAPI(title="Starter Template API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_settings().frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(me.router)
