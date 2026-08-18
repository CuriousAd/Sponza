from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class WalletBalanceResponse(BaseModel):
    wallet_balance: str
    upi_id: Optional[str] = None
    upi_verified: bool


class WithdrawRequest(BaseModel):
    amount: Decimal = Field(..., ge=100)


class WithdrawResponse(BaseModel):
    withdrawal_id: str
    amount: str
    upi_id: str
    status: str


class TipFeedItem(BaseModel):
    id: str
    donor_name: str
    amount: float
    message: Optional[str] = None
    timestamp: int
