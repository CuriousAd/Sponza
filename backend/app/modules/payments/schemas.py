from typing import Optional
from pydantic import BaseModel, Field


class CreateTipOrderRequest(BaseModel):
    creator_slug: str
    donor_name: str = Field(..., min_length=1, max_length=30)
    amount: float = Field(..., ge=10, le=50000)
    message: Optional[str] = Field(default=None, max_length=150)


class CreateTipOrderResponse(BaseModel):
    order_id: str
    payment_session_id: str
    amount: float
    creator_name: str
