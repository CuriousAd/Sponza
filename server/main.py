from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from config import settings
from db import connect_db
from routes.auth import router as auth_router
from routes.tip import router as tip_router
from routes.overlay import router as overlay_router
from routes.webhooks.cashfree import router as cashfree_webhook_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect to MongoDB. Shutdown: cleanup."""
    client = await connect_db()
    yield
    client.close()


app = FastAPI(
    title="Sponsa API",
    version="1.0.0",
    lifespan=lifespan,
)

# Session middleware — required by Authlib OAuth to persist state/nonce
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.jwt_secret,
    same_site="lax",
    https_only=False,  # localhost dev runs over http
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth_router)
app.include_router(tip_router)
app.include_router(overlay_router)
app.include_router(cashfree_webhook_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
