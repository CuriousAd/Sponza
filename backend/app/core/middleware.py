from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.config import settings


def setup_middleware(app: FastAPI):
    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:8080"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Session Middleware (required by Authlib for OAuth state)
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.jwt_secret,
        max_age=3600,
        https_only=False,  # Set to True in production with HTTPS
    )
