import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.exceptions import SponsaException, sponsa_exception_handler
from app.core.middleware import setup_middleware
from app.database import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("sponsa.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Sponsa API Backend...")
    try:
        await init_db()
    except Exception as e:
        logger.warning(f"Database connection failed on startup: {e}. Backend will continue initialization.")
    yield
    logger.info("Shutting down Sponsa API Backend...")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Sponsa Payment Platform API",
        version="1.0.0",
        description="High-volume real-time UPI tip & split payment system for creators.",
        lifespan=lifespan,
    )

    setup_middleware(app)
    app.add_exception_handler(SponsaException, sponsa_exception_handler)

    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "ok", "service": "Sponsa Platform API"}

    register_routers(app)
    setup_frontend(app)
    return app


def setup_frontend(app: FastAPI):
    from pathlib import Path
    import os
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    custom_dist = os.getenv("FRONTEND_DIST_DIR")
    if custom_dist:
        dist_path = Path(custom_dist).resolve()
    else:
        # Default relative to backend/app/main.py -> backend/app -> backend -> root -> frontend/dist
        dist_path = (Path(__file__).resolve().parent.parent.parent / "frontend" / "dist").resolve()

    if dist_path.exists() and (dist_path / "index.html").exists():
        logger.info(f"Serving frontend SPA static files from: {dist_path}")
        assets_path = dist_path / "assets"
        if assets_path.exists():
            app.mount("/assets", StaticFiles(directory=str(assets_path)), name="assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str):
            candidate = dist_path / full_path
            if full_path and candidate.is_file():
                return FileResponse(candidate)
            return FileResponse(dist_path / "index.html")
    else:
        logger.info(f"Frontend dist not found at {dist_path}. Running in API-only mode.")


def register_routers(app: FastAPI):
    from app.modules.auth.router import router as auth_router
    from app.modules.creators.router import router as creators_router
    from app.modules.payments.router import router as payments_router
    from app.modules.webhooks.router import router as webhooks_router
    from app.modules.wallet.router import router as wallet_router
    from app.modules.overlay.router import router as overlay_router

    app.include_router(auth_router)
    app.include_router(creators_router)
    app.include_router(payments_router)
    app.include_router(webhooks_router)
    app.include_router(wallet_router)
    app.include_router(overlay_router)


app = create_app()
