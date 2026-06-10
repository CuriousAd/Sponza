from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document, Indexed
from pydantic import EmailStr, Field


class WaitlistStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Waitlist(Document):
    email: Indexed(EmailStr, unique=True)
    name: str = Field(max_length=100)
    youtube_url: str
    message: Optional[str] = Field(default=None, max_length=500)
    status: WaitlistStatus = WaitlistStatus.PENDING

    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    clerk_invitation_id: Optional[str] = None
    clerk_user_id: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "waitlist"
        indexes = [
            [("status", 1), ("created_at", -1)],
            [("created_at", -1)],
        ]