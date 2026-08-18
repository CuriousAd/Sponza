import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.exceptions import SponzaException, sponza_exception_handler
from app.core.middleware import setup_middleware
from app.database import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("sponza.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Sponza API Backend...")
    try:
        await init_db()
    except Exception as e:
        logger.warning(f"Database connection failed on startup: {e}. Backend will continue initialization.")
    yield
    logger.info("Shutting down Sponza API Backend...")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Sponza Payment Platform API",
        version="1.0.0",
        description="High-volume real-time UPI tip & split payment system for creators.",
        lifespan=lifespan,
    )

    setup_middleware(app)
    app.add_exception_handler(SponzaException, sponza_exception_handler)

    @app.get("/health", tags=["Health"])
    async def health_check():
        return {"status": "ok", "service": "Sponza Platform API"}

    register_routers(app)
    return app


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
