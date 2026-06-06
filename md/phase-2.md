# Phase 2 — Collections, Schemas & Indexes

> **Goal:** Define every MongoDB collection Sponsa needs, with document shapes, Beanie models, indexes, and concurrency validations.

---

## Collections Overview

| Collection | Build When | Purpose |
|------------|-----------|---------|
| `creators` | **Week 1** | Creator documents with OAuth fields & wallet balance |
| `tips` | **Week 2** | Individual tip records (permanent storage) |
| `withdrawals` | **Week 2** | Creator payout requests (processed via Payouts) |
| `sponsa_revenue` | **Week 2** | Platform fee ledger |
| `webhook_events` | **Week 1** | Raw webhook audit log for strict idempotency |

---

## Python Stack for MongoDB

- **Motor:** Async MongoDB driver wrapping pymongo.
- **Beanie:** Async ODM built on Motor + Pydantic.
- **Pydantic:** Data validation (built into FastAPI).

```bash
pip install motor beanie pydantic[email]
```

---

## 1. `webhook_events` (Strict Idempotency Log)

To prevent processing duplicate webhooks under load, every webhook is logged first.

### Document Schema
```json
{
  "_id": "ObjectId",
  "source": "cashfree",
  "event_type": "order.payment.captured",
  "cashfree_payment_id": "cf_pay_99182398123",
  "payload": { ... },
  "status": "pending",
  "attempts": 1,
  "last_error": null,
  "received_at": "ISODate",
  "processed_at": null
}
```

### Beanie Model
```python
# server/models/webhook_event.py
from datetime import datetime
from typing import Optional
from beanie import Document, Indexed

class WebhookEvent(Document):
    source: str
    event_type: str
    cashfree_payment_id: Indexed(str, unique=True)
    payload: dict
    status: str = "pending"  # pending, processing, done, failed
    attempts: int = 0
    last_error: Optional[str] = None
    received_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None

    class Settings:
        name = "webhook_events"
        indexes = [
            [("status", 1), ("received_at", 1)],
        ]
```

---

## 2. `creators`

On Google OAuth signup, a creator document is initialized.

### Document Schema
```json
{
  "_id": "ObjectId",
  "google_id": "google_102839182",
  "email": "creator@example.com",
  "slug": "ronak",
  "display_name": "Ronak",
  "avatar_url": "https://lh3.googleusercontent.com/...",
  "youtube_url": null,
  "cashfree_vendor_id": "vend_ronak_123",
  "upi_id": null,
  "upi_verified": false,
  "wallet_balance": "Decimal128(0.00)",
  "obs_token": "random_32_char_hex_token",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

### Beanie Model
```python
# server/models/creator.py
from datetime import datetime
from decimal import Decimal
from typing import Optional
from beanie import Document, Indexed
from pydantic import EmailStr, Field

class Creator(Document):
    google_id: Indexed(str, unique=True)
    email: Indexed(EmailStr, unique=True)
    slug: Indexed(str, unique=True)
    display_name: str
    avatar_url: Optional[str] = None
    youtube_url: Optional[str] = None

    # Cashfree EasySplit & Payouts
    cashfree_vendor_id: Optional[str] = None
    upi_id: Optional[str] = None
    upi_verified: bool = False

    # Virtual Wallet Ledger (matches Cashfree Vault balance)
    wallet_balance: Decimal = Decimal("0.00")

    # OBS WebSocket Auth
    obs_token: Indexed(str, unique=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "creators"
```

---

## 3. `tips`

Recorded when a payment is captured. Permanently stored for audits.

### Document Schema
```json
{
  "_id": "ObjectId",
  "creator_id": "ObjectId",
  "donor_name": "Raj",
  "message": "Love your content!",
  "amount": "Decimal128(100.00)",
  "creator_share": "Decimal128(90.00)",
  "sponsa_fee": "Decimal128(10.00)",
  "cashfree_payment_id": "cf_pay_99182398123",
  "cashfree_order_id": "sponsa_ord_234872938",
  "timestamp": "ISODate"
}
```

### Beanie Model
```python
# server/models/tip.py
from datetime import datetime
from decimal import Decimal
from typing import Optional
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

class Tip(Document):
    creator_id: Indexed(PydanticObjectId)
    donor_name: str = Field(max_length=30)
    message: Optional[str] = Field(default=None, max_length=150)
    amount: Decimal
    creator_share: Decimal
    sponsa_fee: Decimal
    cashfree_payment_id: Indexed(str, unique=True)
    cashfree_order_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "tips"
        indexes = [
            [("creator_id", 1), ("timestamp", -1)],
        ]
```

---

## 4. `withdrawals`

Tracks manual withdrawal requests routed via Cashfree Payouts.

### Beanie Model
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
    cashfree_transfer_id: Optional[str] = None
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

---

## 5. `sponsa_revenue`

Tracks platform fees collected by Sponsa.

### Beanie Model
```python
# server/models/revenue.py
from datetime import datetime
from decimal import Decimal
from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

class SponSaRevenue(Document):
    tip_id: Indexed(PydanticObjectId, unique=True)
    cashfree_payment_id: str
    amount: Decimal
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "sponsa_revenue"
        indexes = [
            [("recorded_at", -1)],
        ]
```

---

## Atomic Storage Engine Increments (Concurrency Safeguard)

To prevent write conflicts and balance corruption during viral stream tipping spikes, **do not** use read-modify-write. Update the balance field utilizing MongoDB's atomic `$inc` operator:

```python
from bson import Decimal128

await Creator.get_motor_collection().update_one(
    {"_id": creator_id},
    {"$inc": {"wallet_balance": Decimal128(str(creator_share))}}
)
```

---

## Verification Checklist

- [ ] Unique index constraints verified on `webhook_events.cashfree_payment_id`
- [ ] Unique index constraints verified on `creators.google_id` and `creators.slug`
- [ ] Wallet balance uses MongoDB `Decimal128` matching python's `Decimal` type
- [ ] Index created on `tips` (compounded creator_id + timestamp) for dashboard feed performance
- [ ] Verified that **no** TTL index is present on the `tips` collection

---

## What's Next

→ **[Phase 3](./phase-3.md)** — Backend API Scaffold, Database Connection, and Cashfree Client wrapper.
