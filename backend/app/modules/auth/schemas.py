from typing import Optional
from pydantic import BaseModel, EmailStr


class AuthResponse(BaseModel):
    authenticated: bool
    creator_id: Optional[str] = None
    email: Optional[EmailStr] = None
    display_name: Optional[str] = None
