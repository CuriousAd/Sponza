from typing import Optional
from pydantic import BaseModel, EmailStr


class CreatorResponse(BaseModel):
    id: str
    slug: str
    display_name: str
    email: EmailStr
    avatar_url: Optional[str] = None
    youtube_url: Optional[str] = None
    upi_id: Optional[str] = None
    upi_verified: bool
    wallet_balance: str
    obs_token: str


class CreatorUpdate(BaseModel):
    display_name: Optional[str] = None
    youtube_url: Optional[str] = None
    upi_id: Optional[str] = None
