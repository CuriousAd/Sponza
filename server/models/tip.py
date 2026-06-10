from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class Tip(Document):
    creator_id: Indexed(PydanticObjectId)
    donor_name: str = Field(max_length=100)
    message: Optional[str] = Field(default=None, max_length=500)

    # Money — always use Decimal for currency
    amount: Decimal
    creator_share: Decimal       # 90%
    sponsa_fee: Decimal          # 10%

    # Razorpay references
    razorpay_payment_id: Indexed(str, unique=True)
    razorpay_order_id: str
    session_id: Optional[str] = None

    timestamp: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(
        default_factory=lambda: datetime.utcnow() + timedelta(hours=72)
    )

    class Settings:
        name = "tips"
        indexes = [
            [("creator_id", 1), ("timestamp", -1)],
        ]
