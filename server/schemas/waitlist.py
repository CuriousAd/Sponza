from typing import Optional
from pydantic import BaseModel, EmailStr, Field, HttpUrl


class WaitlistCreateRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=100)
    youtube_url: HttpUrl
    message: Optional[str] = Field(default=None, max_length=500)


class WaitlistCreateResponse(BaseModel):
    message: str
    id: str


class WaitlistCheckResponse(BaseModel):
    exists: bool
    status: Optional[str] = None


class ErrorResponse(BaseModel):
    error: str