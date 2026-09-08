import logging
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("sponsa.database")


async def init_db():
    logger.info("Initializing MongoDB connection...")
    client = AsyncIOMotorClient(settings.mongodb_uri)

    # Deferred imports to avoid circular imports during module load
    from app.modules.creators.models import Creator
    from app.modules.payments.models import Tip, SponsaRevenue
    from app.modules.webhooks.models import WebhookEvent
    from app.modules.wallet.models import Withdrawal

    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[
            Creator,
            Tip,
            SponsaRevenue,
            WebhookEvent,
            Withdrawal,
        ],
    )
    logger.info("MongoDB database initialization complete.")
