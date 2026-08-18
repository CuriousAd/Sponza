from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from beanie import Document, Indexed
from pydantic import EmailStr, Field


class Creator(Document):
    google_id: Indexed(str, unique=True) # type: ignore
    email: Indexed(EmailStr, unique=True) # type: ignore
    slug: Indexed(str, unique=True) # type: ignore
    display_name: str
    avatar_url: Optional[str] = None
    youtube_url: Optional[str] = None

    # Cashfree EasySplit Vendor details
    cashfree_vendor_id: Optional[str] = None
    upi_id: Optional[str] = None
    upi_verified: bool = False

    # Internal Ledger Wallet Balance
    wallet_balance: Decimal = Decimal("0.00")

    # OBS Overlay Authentication Token
    obs_token: Indexed(str, unique=True) # type: ignore

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "creators"
        indexes = [
            [("slug", 1)],
            [("obs_token", 1)],
        ]
