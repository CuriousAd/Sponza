from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.config import settings


def setup_middleware(app: FastAPI):
    # CORS - Allow main domain, app subdomain, and local dev environments
    origins = {
        settings.frontend_url.rstrip("/"),
        "https://sponsa.tech",
        "https://www.sponsa.tech",
        "https://app.sponsa.tech",
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    }

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Session Middleware (required by Authlib for OAuth state)
    is_https = settings.frontend_url.startswith("https")
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.jwt_secret,
        max_age=3600,
        https_only=is_https,
    )
