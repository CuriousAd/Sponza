from fastapi import APIRouter
from app.modules.payments.schemas import CreateTipOrderRequest, CreateTipOrderResponse
from app.modules.payments.service import create_tip_order

router = APIRouter(prefix="/api/tip", tags=["Tips & Payments"])


@router.post("/create-order", response_model=CreateTipOrderResponse)
async def handle_create_tip_order(req: CreateTipOrderRequest):
    """Public endpoint to create a Cashfree tip order for a creator."""
    return await create_tip_order(req)
