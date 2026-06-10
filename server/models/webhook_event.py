from datetime import datetime
from typing import Optional

from beanie import Document, Indexed
from pydantic import Field


class WebhookEvent(Document):
    source: str  # "cashfree"
    event_type: str  # "order.payment.captured"
    cashfree_payment_id: Indexed(str)  # dedup key
    payload: dict  # raw event body
    status: str = "pending"  # pending → processing → done → failed
    attempts: int = 0
    last_error: Optional[str] = None
    received_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None

    class Settings:
        name = "webhook_events"
        indexes = [
            [("status", 1), ("received_at", 1)],
            [("cashfree_payment_id", 1)],
        ]
