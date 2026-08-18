from datetime import datetime, timezone
from typing import Optional
from beanie import Document, Indexed
from pydantic import Field


class WebhookEvent(Document):
    source: str = "cashfree"
    event_type: str
    cashfree_payment_id: Indexed(str) # type: ignore
    payload: dict
    status: str = "pending"  # pending | processing | done | failed
    attempts: int = 0
    last_error: Optional[str] = None
    received_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processed_at: Optional[datetime] = None

    class Settings:
        name = "webhook_events"
        indexes = [
            [("status", 1), ("received_at", 1)],
            [("cashfree_payment_id", 1)],
        ]
