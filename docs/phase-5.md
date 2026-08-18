# Phase 5 — Cashfree PG, EasySplit & Real-Time WebSockets

> **Goal:** viewers send tips through Cashfree PG, Sponsa splits payment via EasySplit, webhooks handle payments asynchronously with strict idempotency, and updates trigger OBS overlay overlays in real-time.

---

## 1. Viewer Tipping Endpoint

When a viewer wants to tip a creator, the backend creates an order via Cashfree.

```python
# server/routes/tip.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import time

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
        raise HTTPException(status_code=400, detail="Creator is not configured to accept tips")

    order_id = f"sponsa_ord_{int(time.time())}"
    
    # Declare the split at order creation time (90% to creator's vendor vault)
    try:
        cf_order = await cashfree_client.create_order(
            order_id=order_id,
            amount=data.amount,
            customer_name=data.donor_name,
            vendor_id=creator.cashfree_vendor_id,
            split_pct=90.0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create order session: {str(e)}")

    return {
        "order_id": order_id,
        "payment_session_id": cf_order.get("payment_session_id"),
        "amount": data.amount
    }
```

---

## 2. Inbound Webhook Handler (Immediate Acknowledgment)

Cashfree calls Sponsa when the user completes payment. Sponsa logs the event, schedules background execution, and responds immediately to avoid timeouts.

```python
# server/routes/webhooks/cashfree.py
import json
import hmac
import hashlib
import base64
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from datetime import datetime

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
    existing = await WebhookEvent.find_one(WebhookEvent.cashfree_payment_id == str(payment_id))
    if existing:
        return {"received": True, "status": "duplicate"}

    # 3. Log raw event state
    event = WebhookEvent(
        source="cashfree",
        event_type=event_type,
        cashfree_payment_id=str(payment_id),
        payload=payload,
        received_at=datetime.utcnow()
    )
    await event.insert()

    # 4. Offload processing to background task & return 200 OK
    bg.add_task(process_payment_captured, event.id, payload)
    return {"received": True}
```

---

## 3. Background Tip Processing & Atomic Updates

```python
# server/services/tip_processor.py
import asyncio
from decimal import Decimal
from bson import Decimal128
from datetime import datetime

from models.webhook_event import WebhookEvent
from models.tip import Tip
from models.creator import Creator
from models.revenue import SponSaRevenue
from services.ws_manager import ws_manager

# Safeguard database concurrency under heavy load
_tip_semaphore = asyncio.Semaphore(20)

async def process_payment_captured(event_id, payload):
    async with _tip_semaphore:
        event = await WebhookEvent.get(event_id)
        if not event:
            return

        try:
            event.status = "processing"
            await event.save()

            data = payload["data"]
            order_id = data["order"]["order_id"]
            amount = Decimal(str(data["order"]["order_amount"]))
            payment_id = str(data["payment"]["cf_payment_id"])

            # Deduce fees
            creator_share = amount * Decimal("0.90")
            sponsa_fee = amount * Decimal("0.10")

            # Find matching creator
            # (Note: we query for the creator using the vendor ID in the split payload)
            split_details = data.get("splits", [{}])[0]
            vendor_id = split_details.get("vendor_id")
            creator = await Creator.find_one(Creator.cashfree_vendor_id == vendor_id)
            if not creator:
                raise ValueError(f"No creator found matching vendor_id: {vendor_id}")

            # 1. Write Tip Document (idempotent key on cashfree_payment_id stops duplicates)
            tip = Tip(
                creator_id=creator.id,
                donor_name=data.get("customer_details", {}).get("customer_name", "Anonymous"),
                message=data.get("notes", {}).get("message"), # Custom viewer message
                amount=amount,
                creator_share=creator_share,
                sponsa_fee=sponsa_fee,
                cashfree_payment_id=payment_id,
                cashfree_order_id=order_id
            )
            await tip.insert()

            # 2. Increment Wallet Ledger (Atomic Update)
            await Creator.get_motor_collection().update_one(
                {"_id": creator.id},
                {"$inc": {"wallet_balance": Decimal128(str(creator_share))}}
            )

            # 3. Log Revenue Record
            revenue = SponSaRevenue(
                tip_id=tip.id,
                cashfree_payment_id=payment_id,
                amount=sponsa_fee
            )
            await revenue.insert()

            # 4. Trigger Real-Time OBS broadcast (Omit messages for privacy)
            await ws_manager.broadcast_tip(
                str(creator.id),
                {
                    "type": "tip",
                    "donor_name": tip.donor_name,
                    "amount": float(tip.amount)
                }
            )

            # Mark complete
            event.status = "done"
            event.processed_at = datetime.utcnow()
            await event.save()

        except Exception as e:
            event.status = "failed"
            event.attempts += 1
            event.last_error = str(e)
            await event.save()
```

---

## 4. Real-Time Overlay Server (WebSockets)

```python
# server/services/ws_manager.py
from fastapi import WebSocket, WebSocketDisconnect
from collections import defaultdict

class ConnectionManager:
    def __init__(self):
        # Maps creator_id string to active WebSocket instances
        self.active_connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, creator_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[creator_id].add(websocket)

    def disconnect(self, creator_id: str, websocket: WebSocket):
        self.active_connections[creator_id].discard(websocket)

    async def broadcast_tip(self, creator_id: str, message: dict):
        """Sends data immediately to all connected screens for a creator."""
        if creator_id not in self.active_connections:
            return

        dead_connections = []
        for ws in self.active_connections[creator_id]:
            try:
                await ws.send_json(message)
            except WebSocketDisconnect:
                dead_connections.append(ws)
            except Exception:
                dead_connections.append(ws)

        # Cleanup disconnected views
        for ws in dead_connections:
            self.disconnect(creator_id, ws)

ws_manager = ConnectionManager()
```

---

## OBS Overlay Endpoint

```python
# server/routes/overlay.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from models.creator import Creator
from services.ws_manager import ws_manager

router = APIRouter(prefix="/api/overlay", tags=["overlay"])

@router.websocket("/ws/{obs_token}")
async def websocket_overlay(websocket: WebSocket, obs_token: str):
    # Authenticate token
    creator = await Creator.find_one(Creator.obs_token == obs_token)
    if not creator:
        await websocket.close(code=4001)  # Unauthorized
        return

    creator_id = str(creator.id)
    await ws_manager.connect(creator_id, websocket)

    try:
        while True:
            # Keep connection open and check health
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(creator_id, websocket)
    except Exception:
        ws_manager.disconnect(creator_id, websocket)
```

---

## Verification Checklist

- [ ] Check viewer API handles amounts under ₹10 or over ₹50,000 cleanly
- [ ] Confirm split orders declare vendor vault parameters accurately
- [ ] Signature check flags altered payloads with status 400
- [ ] Webhooks acknowledge inside the 5-second boundary returning `200`
- [ ] Multiple webhook queries with the same payment id are skipped (idempotent)
- [ ] WebSocket broadcasts tip notifications in less than 2 seconds
- [ ] OBS overlay endpoints drop connection for invalid tokens
