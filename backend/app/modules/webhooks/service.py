import json
import logging
from datetime import datetime, timezone
from fastapi import BackgroundTasks, HTTPException, status
from app.core.security import verify_cashfree_signature
from app.modules.webhooks.models import WebhookEvent
from app.modules.payments.processor import process_payment_captured

logger = logging.getLogger("sponza.webhooks.service")


async def handle_cashfree_webhook(
    raw_body: bytes,
    timestamp: str,
    signature: str,
    bg_tasks: BackgroundTasks,
) -> dict:
    if not verify_cashfree_signature(raw_body, timestamp, signature):
        logger.warning("Invalid Cashfree webhook signature received")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature",
        )

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid JSON payload: {str(e)}",
        )

    event_type = payload.get("type", "unknown")
    payment_data = payload.get("data", {}).get("payment", {})
    payment_id = str(payment_data.get("cf_payment_id", ""))

    if not payment_id:
        return {"received": True, "status": "ignored_no_payment_id"}

    # Idempotency check at WebhookEvent level
    existing_event = await WebhookEvent.find_one(
        WebhookEvent.cashfree_payment_id == payment_id
    )
    if existing_event:
        return {"received": True, "status": "already_processed"}

    # Persist event
    event = WebhookEvent(
        source="cashfree",
        event_type=event_type,
        cashfree_payment_id=payment_id,
        payload=payload,
        status="pending",
        received_at=datetime.now(timezone.utc),
    )
    await event.insert()

    # Enqueue background processor
    if event_type in ("PAYMENT_SUCCESS_WEBHOOK", "ORDER_PAYMENT_SUCCESS", "order.payment.captured"):
        bg_tasks.add_task(process_payment_captured, str(event.id), payload)

    return {"received": True, "status": "enqueued"}
