from datetime import datetime
from decimal import Decimal

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class SponSaRevenue(Document):
    tip_id: Indexed(PydanticObjectId, unique=True)
    razorpay_payment_id: str
    amount: Decimal
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "sponsa_revenue"
        indexes = [
            [("recorded_at", -1)],
        ]
