import time
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from models.creator import Creator
from services.cashfree import cashfree_client

router = APIRouter(prefix="/api/tip", tags=["tips"])


class CreateTipOrder(BaseModel):
    creator_slug: str
    donor_name: str = Field(..., max_length=30)
    amount: float = Field(..., ge=10.0, le=50000.0)  # ₹10 to ₹50,000
    message: Optional[str] = Field(None, max_length=150)


@router.post("/create-order")
async def create_tip_order(data: CreateTipOrder):
    # Find creator profile
    creator = await Creator.find_one(Creator.slug == data.creator_slug)
    if not creator or not creator.cashfree_vendor_id:
        raise HTTPException(
            status_code=400, detail="Creator is not configured to accept tips"
        )

    order_id = f"sponsa_ord_{int(time.time())}"

    # Declare the split at order creation time (90% to creator's vendor vault)
    try:
        cf_order = await cashfree_client.create_order(
            order_id=order_id,
            amount=data.amount,
            customer_name=data.donor_name,
            vendor_id=creator.cashfree_vendor_id,
            split_pct=90.0,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create order session: {str(e)}"
        )

    return {
        "order_id": order_id,
        "payment_session_id": cf_order.get("payment_session_id"),
        "amount": data.amount,
    }
