from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class Tip(Document):
    creator_id: Indexed(PydanticObjectId) # type: ignore
    donor_name: str = Field(max_length=30)
    message: Optional[str] = Field(default=None, max_length=150)
    amount: Decimal
    creator_share: Decimal
    sponza_fee: Decimal
    cashfree_payment_id: Indexed(str, unique=True) # type: ignore
    cashfree_order_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "tips"
        indexes = [
            [("creator_id", 1), ("timestamp", -1)],
            [("cashfree_payment_id", 1)],
        ]


class SponzaRevenue(Document):
    tip_id: Indexed(PydanticObjectId) # type: ignore
    amount: Decimal
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "sponza_revenue"
