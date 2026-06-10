import json
import hmac
import hashlib
import base64
from datetime import datetime

from fastapi import APIRouter, Request, HTTPException, BackgroundTasks

from config import settings
from models.webhook_event import WebhookEvent
from services.tip_processor import process_payment_captured

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


def verify_cashfree_signature(raw_body: bytes, timestamp: str, signature: str) -> bool:
    """Validate signature using raw body bytes and Webhook Secret."""
    sign_str = timestamp.encode() + raw_body
    secret = settings.cashfree_webhook_secret.encode()

    hash_obj = hmac.new(secret, sign_str, hashlib.sha256)
    expected_sig = base64.b64encode(hash_obj.digest()).decode("utf-8")
    return hmac.compare_digest(expected_sig, signature)


@router.post("/cashfree")
async def cashfree_webhook(request: Request, bg: BackgroundTasks):
    raw_body = await request.body()
    timestamp = request.headers.get("x-webhook-timestamp", "")
    signature = request.headers.get("x-webhook-signature", "")

    # 1. Validate signature
    if not verify_cashfree_signature(raw_body, timestamp, signature):
        raise HTTPException(status_code=400, detail="Invalid signature")

    payload = json.loads(raw_body)
    event_type = payload.get("type")

    # We only process successful captured payments
    if event_type != "order.payment.captured":
        return {"status": "ignored"}

    payment_data = payload.get("data", {}).get("payment", {})
    payment_id = payment_data.get("cf_payment_id")

    # 2. Strict Idempotency Check
    existing = await WebhookEvent.find_one(
        WebhookEvent.cashfree_payment_id == str(payment_id)
    )
    if existing:
        return {"received": True, "status": "duplicate"}

    # 3. Log raw event state
    event = WebhookEvent(
        source="cashfree",
        event_type=event_type,
        cashfree_payment_id=str(payment_id),
        payload=payload,
        received_at=datetime.utcnow(),
    )
    await event.insert()

    # 4. Offload processing to background task & return 200 OK
    bg.add_task(process_payment_captured, event.id, payload)
    return {"received": True}
