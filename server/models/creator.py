from datetime import datetime
from decimal import Decimal
from typing import Optional

from beanie import Document, Indexed
from pydantic import EmailStr, Field


class Creator(Document):
    clerk_user_id: Indexed(str, unique=True)
    email: Indexed(EmailStr, unique=True)
    slug: Indexed(str, unique=True)  # sponsa.in/{slug}
    display_name: str
    avatar_url: Optional[str] = None
    youtube_url: Optional[str] = None
    upi_id: Optional[str] = None
    wallet_balance: Decimal = Decimal("0.00")
    approved: bool = True
    onboarded_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "creators"
