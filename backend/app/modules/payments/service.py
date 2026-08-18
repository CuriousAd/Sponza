import time
from app.core.exceptions import NotFoundError, PaymentError
from app.core.security import sanitize_text
from app.integrations.cashfree.client import cashfree_client
from app.modules.creators.models import Creator
from app.modules.payments.schemas import CreateTipOrderRequest, CreateTipOrderResponse


async def create_tip_order(req: CreateTipOrderRequest) -> CreateTipOrderResponse:
    creator = await Creator.find_one(Creator.slug == req.creator_slug)
    if not creator:
        raise NotFoundError(f"Creator with slug '{req.creator_slug}' not found")

    sanitized_name = sanitize_text(req.donor_name) or "Anonymous"
    order_id = f"tip_{str(creator.id)}_{int(time.time() * 1000)}"

    try:
        cf_response = await cashfree_client.create_order(
            order_id=order_id,
            amount=req.amount,
            customer_name=sanitized_name,
            vendor_id=creator.cashfree_vendor_id,
            split_percentage=90.0,
        )

        payment_session_id = cf_response.get("payment_session_id", "")
        return CreateTipOrderResponse(
            order_id=order_id,
            payment_session_id=payment_session_id,
            amount=req.amount,
            creator_name=creator.display_name,
        )
    except Exception as e:
        raise PaymentError(f"Failed to initialize Cashfree payment: {str(e)}")
