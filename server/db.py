from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from config import settings
from models.creator import Creator
from models.tip import Tip
from models.withdrawal import Withdrawal
from models.revenue import SponSaRevenue
from models.webhook_event import WebhookEvent


async def connect_db():
    """Initialize Motor client and Beanie ODM."""
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]

    await init_beanie(
        database=db,
        document_models=[
            Creator,
            Tip,
            Withdrawal,
            SponSaRevenue,
            WebhookEvent,
        ],
    )
    print(f"✅ Connected to MongoDB: {settings.mongodb_db_name}")
    return client
