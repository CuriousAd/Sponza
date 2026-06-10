from datetime import datetime
from decimal import Decimal
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class Tip(Document):
    creator_id: Indexed(PydanticObjectId)
    donor_name: str = Field(max_length=30)  # PRD: 30 char max
    message: Optional[str] = Field(default=None, max_length=150)  # PRD: 150 char max

    # Money — always use Decimal for currency
    amount: Decimal
    creator_share: Decimal  # 90%
    sponsa_fee: Decimal  # 10%

    # Cashfree references
    cashfree_payment_id: Indexed(str, unique=True)  # idempotency
    cashfree_order_id: str

    timestamp: datetime = Field(default_factory=datetime.utcnow)
    # No TTL — permanent retention per PRD §6.2

    class Settings:
        name = "tips"
        indexes = [
            [("creator_id", 1), ("timestamp", -1)],
        ]
