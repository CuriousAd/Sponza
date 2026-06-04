# Phase 5 — Razorpay Payments: Tips, Wallet & Withdrawals

> **Goal:** Viewers can tip creators via UPI. Tips are recorded, wallets credited, and creators can withdraw to their UPI.

> This phase implements everything in [payments.md](./payments.md) using the collections from [Phase 2](./phase-2.md).

---

## Prerequisites

- [ ] Razorpay account created at [dashboard.razorpay.com](https://dashboard.razorpay.com)
- [ ] Business KYC completed (Proprietorship/LLP/Pvt Ltd + PAN + bank account)
- [ ] Razorpay X (Payouts) enabled — apply at [razorpay.com/x](https://razorpay.com/x)
- [ ] Test mode API keys available

---

## Step 1 — Install & Configure Razorpay

```bash
pip install razorpay
```

Add to `server/requirements.txt`:

```txt
razorpay==1.*
```

### Razorpay Client

```python
# server/lib/razorpay_client.py
import razorpay
from config import settings

client = razorpay.Client(
    auth=(settings.razorpay_key_id, settings.razorpay_key_secret)
)
```

### Update Config

```python
# server/config.py — add Razorpay settings
class Settings(BaseSettings):
    # ... existing fields ...

    # Razorpay
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""
    razorpay_x_account_number: str = ""
```

---

## Step 2 — Tip & Withdrawal Models

```python
# server/models/tip.py
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class Tip(Document):
    creator_id: Indexed(PydanticObjectId)
    donor_name: str = Field(max_length=100)
    message: Optional[str] = Field(default=None, max_length=500)
    amount: Decimal
    creator_share: Decimal
    sponsa_fee: Decimal
    razorpay_payment_id: Indexed(str, unique=True)
    razorpay_order_id: str
    session_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(
        default_factory=lambda: datetime.utcnow() + timedelta(hours=72)
    )

    class Settings:
        name = "tips"
        indexes = [
            [("creator_id", 1), ("timestamp", -1)],
        ]
```

```python
# server/models/withdrawal.py
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class WithdrawalStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class Withdrawal(Document):
    creator_id: Indexed(PydanticObjectId)
    amount: Decimal
    upi_id: str
    razorpay_payout_id: Optional[str] = None
    status: WithdrawalStatus = WithdrawalStatus.PENDING
    failure_reason: Optional[str] = None
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None

    class Settings:
        name = "withdrawals"
        indexes = [
            [("creator_id", 1), ("requested_at", -1)],
        ]
```

```python
# server/models/revenue.py
from datetime import datetime
from decimal import Decimal

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class SponSaRevenue(Document):
    tip_id: Indexed(PydanticObjectId, unique=True)
    razorpay_payment_id: str
    amount: Decimal
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "sponsa_revenue"
        indexes = [
            [("recorded_at", -1)],
        ]
```

---

## Step 3 — Tip Creation Flow (Viewer Side)

### 3.1 Create Razorpay Order

```python
# server/routes/tip.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from models.creator import Creator
from lib.razorpay_client import client as razorpay_client
from config import settings

router = APIRouter(prefix="/api/tip", tags=["tips"])


class CreateOrderRequest(BaseModel):
    creator_slug: str
    donor_name: str = Field(min_length=1, max_length=100)
    amount: int = Field(ge=10, le=50000)  # ₹10 min, ₹50k max
    message: Optional[str] = Field(default=None, max_length=500)


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    razorpay_key_id: str
    creator_name: str


@router.post("/create-order", response_model=CreateOrderResponse)
async def create_order(body: CreateOrderRequest):
    """Create a Razorpay order for a viewer tip."""
    # Find creator
    creator = await Creator.find_one(
        Creator.slug == body.creator_slug,
        Creator.approved == True,
    )
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")

    # Create Razorpay order
    import time
    order = razorpay_client.order.create({
        "amount": body.amount * 100,  # paise
        "currency": "INR",
        "receipt": f"tip_{creator.id}_{int(time.time())}",
        "notes": {
            "creator_id": str(creator.id),
            "donor_name": body.donor_name,
            "message": body.message or "",
        },
    })

    return CreateOrderResponse(
        order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
        razorpay_key_id=settings.razorpay_key_id,
        creator_name=creator.display_name,
    )
```

### 3.2 Frontend: Open Razorpay Checkout

```ts
// src/api/tip.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function createTipOrder(data: {
  creator_slug: string; donor_name: string; amount: number; message?: string;
}) {
  const res = await fetch(`${API_URL}/api/tip/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export function openRazorpayCheckout(orderData: any, onSuccess: (r: any) => void) {
  const options = {
    key: orderData.razorpay_key_id,
    amount: orderData.amount,
    currency: orderData.currency,
    order_id: orderData.order_id,
    name: "Sponsa",
    description: `Tip for ${orderData.creator_name}`,
    handler: onSuccess,
    theme: { color: "#6C63FF" },
  };
  const rzp = new (window as any).Razorpay(options);
  rzp.open();
}
```

> Add Razorpay checkout script to `index.html`:
> ```html
> <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
> ```

---

## Step 4 — Razorpay Webhook: `payment.captured`

> **Critical:** Never trust the frontend to confirm payment. Always verify server-side.

```python
# server/routes/razorpay_webhook.py
import hashlib
import hmac
from datetime import datetime
from decimal import Decimal

from beanie import PydanticObjectId
from fastapi import APIRouter, Request, HTTPException

from config import settings
from models.tip import Tip
from models.creator import Creator
from models.withdrawal import Withdrawal
from models.revenue import SponSaRevenue

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


def verify_razorpay_signature(body: bytes, signature: str) -> bool:
    """Verify Razorpay webhook HMAC-SHA256 signature."""
    expected = hmac.new(
        settings.razorpay_webhook_secret.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/razorpay")
async def razorpay_webhook(request: Request):
    """Handle Razorpay payment and payout webhooks."""
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")

    # Step 1: Verify HMAC signature
    if not verify_razorpay_signature(body, signature):
        raise HTTPException(status_code=400, detail="Invalid signature")

    import json
    payload = json.loads(body)
    event = payload.get("event")

    # Step 2: Handle payment.captured (tip received)
    if event == "payment.captured":
        payment = payload["payload"]["payment"]["entity"]
        notes = payment.get("notes", {})

        creator_id = notes.get("creator_id")
        donor_name = notes.get("donor_name", "Anonymous")
        message = notes.get("message") or None

        tip_amount = Decimal(str(payment["amount"])) / 100  # paise → rupees
        sponsa_fee = tip_amount * Decimal("0.10")
        creator_share = tip_amount * Decimal("0.90")

        # Idempotency check
        existing = await Tip.find_one(Tip.razorpay_payment_id == payment["id"])
        if existing:
            return {"message": "Already processed"}

        # Atomic transaction: tip + wallet + revenue
        session = await Tip.get_motor_collection().database.client.start_session()
        async with session.start_transaction():
            try:
                # 1. Insert tip
                tip = Tip(
                    creator_id=PydanticObjectId(creator_id),
                    donor_name=donor_name,
                    message=message,
                    amount=tip_amount,
                    creator_share=creator_share,
                    sponsa_fee=sponsa_fee,
                    razorpay_payment_id=payment["id"],
                    razorpay_order_id=payment.get("order_id", ""),
                )
                await tip.insert(session=session)

                # 2. Credit creator wallet
                creator = await Creator.get(PydanticObjectId(creator_id), session=session)
                creator.wallet_balance += creator_share
                await creator.save(session=session)

                # 3. Record Sponsa revenue
                revenue = SponSaRevenue(
                    tip_id=tip.id,
                    razorpay_payment_id=payment["id"],
                    amount=sponsa_fee,
                )
                await revenue.insert(session=session)

                print(f"✅ Tip processed: ₹{tip_amount} for creator {creator_id}")
            except Exception as e:
                print(f"❌ Tip processing failed: {e}")
                raise

    # Step 3: Handle payout events (withdrawals)
    if event == "payout.processed":
        payout = payload["payload"]["payout"]["entity"]
        withdrawal = await Withdrawal.find_one(
            Withdrawal.razorpay_payout_id == payout["id"]
        )
        if withdrawal:
            withdrawal.status = "processed"
            withdrawal.processed_at = datetime.utcnow()
            await withdrawal.save()

    if event in ("payout.failed", "payout.reversed"):
        payout = payload["payload"]["payout"]["entity"]
        withdrawal = await Withdrawal.find_one(
            Withdrawal.razorpay_payout_id == payout["id"]
        )
        if withdrawal:
            withdrawal.status = "failed"
            withdrawal.failure_reason = payout.get("failure_reason")
            await withdrawal.save()
            # Refund wallet
            creator = await Creator.get(withdrawal.creator_id)
            if creator:
                creator.wallet_balance += withdrawal.amount
                await creator.save()

    return {"received": True}
```

### Register in main.py

```python
from routes.razorpay_webhook import router as razorpay_webhook_router
app.include_router(razorpay_webhook_router)
```

### Configure in Razorpay Dashboard

1. **Settings → Webhooks → Add New Webhook**
2. URL: `https://your-api.com/api/webhooks/razorpay`
3. Secret: generate a strong secret → save as `RAZORPAY_WEBHOOK_SECRET`
4. Events: `payment.captured`, `payout.processed`, `payout.failed`, `payout.reversed`

---

## Step 5 — Wallet & Withdrawal Routes

```python
# server/routes/wallet.py
from datetime import datetime
from decimal import Decimal
from typing import Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from models.creator import Creator
from models.tip import Tip
from models.withdrawal import Withdrawal
from routes.auth import get_current_user_id

router = APIRouter(prefix="/api/wallet", tags=["wallet"])


class WithdrawRequest(BaseModel):
    amount: int = Field(ge=100, description="Minimum ₹100")


@router.get("/balance")
async def get_balance(clerk_user_id: str = Depends(get_current_user_id)):
    """Get creator's wallet balance."""
    creator = await Creator.find_one(Creator.clerk_user_id == clerk_user_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    return {"balance": float(creator.wallet_balance)}


@router.get("/tips")
async def get_tips(clerk_user_id: str = Depends(get_current_user_id)):
    """Get recent tip feed for dashboard."""
    creator = await Creator.find_one(Creator.clerk_user_id == clerk_user_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    tips = await Tip.find(
        Tip.creator_id == creator.id
    ).sort(-Tip.timestamp).limit(50).to_list()
    return tips


@router.post("/withdraw")
async def request_withdrawal(
    body: WithdrawRequest,
    clerk_user_id: str = Depends(get_current_user_id),
):
    """Request a withdrawal to creator's UPI."""
    creator = await Creator.find_one(Creator.clerk_user_id == clerk_user_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    if not creator.upi_id:
        raise HTTPException(status_code=400, detail="No UPI ID set")

    balance = float(creator.wallet_balance)
    if balance < body.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Deduct from wallet atomically
    session = await Creator.get_motor_collection().database.client.start_session()
    async with session.start_transaction():
        creator.wallet_balance -= Decimal(str(body.amount))
        await creator.save(session=session)

        withdrawal = Withdrawal(
            creator_id=creator.id,
            amount=Decimal(str(body.amount)),
            upi_id=creator.upi_id,
        )
        await withdrawal.insert(session=session)

    # TODO: Call Razorpay X Payout API here (see payments.md Step 7)
    # On success, update withdrawal with razorpay_payout_id and status: "processing"

    return {"message": "Withdrawal requested", "withdrawal_id": str(withdrawal.id)}


@router.get("/withdrawals")
async def get_withdrawals(clerk_user_id: str = Depends(get_current_user_id)):
    """Get withdrawal history."""
    creator = await Creator.find_one(Creator.clerk_user_id == clerk_user_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    withdrawals = await Withdrawal.find(
        Withdrawal.creator_id == creator.id
    ).sort(-Withdrawal.requested_at).to_list()
    return withdrawals
```

Register in `main.py`:

```python
from routes.wallet import router as wallet_router
from routes.tip import router as tip_router

app.include_router(tip_router)
app.include_router(wallet_router)
```

---

## Step 6 — UPI Verification (Penny Drop)

```python
# In server/routes/creator.py — add this endpoint

@router.post("/verify-upi")
async def verify_upi(
    body: dict,
    clerk_user_id: str = Depends(get_current_user_id),
):
    """Verify and save creator's UPI ID via Razorpay penny-drop."""
    upi_id = body.get("upi_id")
    if not upi_id:
        raise HTTPException(status_code=400, detail="UPI ID required")

    # TODO: Call Razorpay X VPA validation API
    # See payments.md Section 5 for the exact API call

    creator = await Creator.find_one(Creator.clerk_user_id == clerk_user_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")

    creator.upi_id = upi_id
    await creator.save()
    return {"message": "UPI ID verified and saved"}
```

---

## API Endpoints Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/api/tip/create-order` | None (public) | Create Razorpay order for viewer |
| `POST` | `/api/webhooks/razorpay` | HMAC signature | Payment + payout webhooks |
| `GET` | `/api/wallet/balance` | Clerk JWT | Creator's wallet balance |
| `GET` | `/api/wallet/tips` | Clerk JWT | Recent tip feed |
| `POST` | `/api/wallet/withdraw` | Clerk JWT | Request withdrawal |
| `GET` | `/api/wallet/withdrawals` | Clerk JWT | Withdrawal history |
| `POST` | `/api/creator/verify-upi` | Clerk JWT | Penny-drop UPI verification |

---

## Verification Checklist

- [ ] Razorpay test keys configured
- [ ] `POST /api/tip/create-order` returns a valid Razorpay order
- [ ] Razorpay checkout opens in frontend with test UPI
- [ ] Webhook receives `payment.captured` → tip + wallet + revenue all updated
- [ ] Duplicate webhook is idempotent (no double-credit)
- [ ] `GET /api/wallet/balance` returns correct Decimal value
- [ ] `POST /api/wallet/withdraw` deducts balance atomically
- [ ] Failed payout → wallet refunded automatically

---

→ **[Phase 6](./phase-6.md)** — Environment management, security hardening, Atlas monitoring, and deployment.
