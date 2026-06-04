# Phase 2 — Collections, Schemas & Indexes

> **Goal:** Define every MongoDB collection Sponsa needs, with document shapes, Pydantic/Beanie models, indexes, and validation.

---

## Collections Overview

| Collection | Build When | Purpose |
|------------|-----------|---------|
| `waitlist` | **Week 1** | Creator signups before launch |
| `creators` | **Week 2** (Clerk) | Approved creators with wallet |
| `tips` | **Week 3+** (payments) | Individual tip records |
| `withdrawals` | **Week 3+** (payments) | Creator payout requests |
| `sponsa_revenue` | **Week 3+** (payments) | Platform fee tracking |

### SQL → MongoDB Mapping (from payments.md)

| payments.md table | MongoDB collection | Key difference |
|---|---|---|
| `users` | `creators` | Added Clerk fields, slug |
| `tips` | `tips` | TTL index for 72h auto-delete |
| `withdrawals` | `withdrawals` | Same structure |
| `sponsa_revenue` | `sponsa_revenue` | Same structure |
| *(new)* | `waitlist` | Pre-launch, not in payments.md |

---

## Python Stack for MongoDB

| Tool | Purpose |
|------|---------|
| **Motor** | Async MongoDB driver (wraps pymongo for asyncio) |
| **Beanie** | Async ODM built on Motor + Pydantic |
| **Pydantic** | Data validation (built into FastAPI) |

```bash
pip install motor beanie pydantic
```

---

## 1. `waitlist` — Build First

### Document Shape

```json
{
  "_id": "ObjectId",
  "email": "creator@example.com",
  "name": "Ronak",
  "youtube_url": "https://youtube.com/@ronak",
  "message": "optional",
  "status": "pending",
  "created_at": "ISODate",
  "updated_at": "ISODate",
  "approved_at": null,
  "approved_by": null,
  "clerk_invitation_id": null,
  "clerk_user_id": null
}
```

### Indexes

```js
db.waitlist.createIndex({ email: 1 }, { unique: true });           // no duplicates
db.waitlist.createIndex({ status: 1, createdAt: -1 });             // admin: pending first
db.waitlist.createIndex({ createdAt: -1 });                        // recent signups
```

### Beanie Model

```python
# server/models/waitlist.py
from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document, Indexed
from pydantic import EmailStr, Field


class WaitlistStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Waitlist(Document):
    email: Indexed(EmailStr, unique=True)
    name: str = Field(max_length=100)
    youtube_url: str
    message: Optional[str] = Field(default=None, max_length=500)
    status: WaitlistStatus = WaitlistStatus.PENDING

    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    clerk_invitation_id: Optional[str] = None
    clerk_user_id: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "waitlist"
        indexes = [
            [("status", 1), ("created_at", -1)],
            [("created_at", -1)],
        ]
```

---

## 2. `creators` — When Clerk Goes Live

### Document Shape

```json
{
  "_id": "ObjectId",
  "clerk_user_id": "user_2abc123",
  "email": "creator@example.com",
  "slug": "ronak",
  "display_name": "Ronak",
  "avatar_url": null,
  "youtube_url": "https://youtube.com/@ronak",
  "upi_id": null,
  "wallet_balance": "Decimal128(0.00)",
  "approved": true,
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
    clerk_user_id: Indexed(str, unique=True)
    email: Indexed(EmailStr, unique=True)
    slug: Indexed(str, unique=True)  # sponsa.in/{slug}
    display_name: str
    avatar_url: Optional[str] = None
    youtube_url: Optional[str] = None
    upi_id: Optional[str] = None
    wallet_balance: Decimal = Decimal("0.00")
    approved: bool = True
    onboarded_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "creators"
        bson_encoders = {
            Decimal: lambda v: Decimal(str(v))  # store as Decimal128
        }
```

### Link Flow: Waitlist → Creator

```
waitlist (status: "approved")
  → admin approves → send Clerk invitation
  → creator signs up via Clerk
  → Clerk webhook: user.created → upsert creators doc
  → creator is live at sponsa.in/{slug}
```

---

## 3. `tips` — Payments Phase

### Beanie Model

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

    # Money — always use Decimal for currency
    amount: Decimal
    creator_share: Decimal       # 90%
    sponsa_fee: Decimal          # 10%

    # Razorpay references
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
            [("creator_id", 1), ("timestamp", -1)],  # dashboard feed
            # TTL index — auto-delete after 72h
            # NOTE: TTL index must be created via mongosh (already done in Phase 2 setup)
        ]
```

> **TTL explained:** The `expires_at` + TTL index means MongoDB auto-deletes tip docs ~72h after creation. No cron needed.

> ⚠️ If you need tip history for tax/analytics, skip the TTL index and archive manually.

---

## 4. `withdrawals`

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
    razorpay_payout_id: Optional[str] = None  # sparse unique
    status: WithdrawalStatus = WithdrawalStatus.PENDING
    failure_reason: Optional[str] = None
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None

    class Settings:
        name = "withdrawals"
        indexes = [
            [("creator_id", 1), ("requested_at", -1)],
            # razorpay_payout_id unique sparse — created via mongosh
        ]
```

---

## 5. `sponsa_revenue`

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

## Critical: Money Type & Transactions

### Why Decimal (not float)

```python
# ❌ Float: 0.1 + 0.2 = 0.30000000000000004
# ✅ Decimal: exact decimal arithmetic for money

from decimal import Decimal
wallet_balance = Decimal("90.00")
```

Beanie/Motor stores Python `Decimal` as MongoDB `Decimal128` automatically.

### Multi-Document Transactions (wallet updates)

When a tip arrives, update 3 collections atomically:

```python
from motor.motor_asyncio import AsyncIOMotorClient

async def process_tip(tip_data: dict, creator_id: str, creator_share: Decimal, sponsa_fee: Decimal):
    client: AsyncIOMotorClient = Tip.get_motor_collection().database.client

    async with await client.start_session() as session:
        async with session.start_transaction():
            # 1. Insert tip
            tip = Tip(**tip_data)
            await tip.insert(session=session)

            # 2. Credit creator wallet
            creator = await Creator.get(creator_id, session=session)
            creator.wallet_balance += creator_share
            await creator.save(session=session)

            # 3. Record Sponsa revenue
            revenue = SponSaRevenue(
                tip_id=tip.id,
                razorpay_payment_id=tip.razorpay_payment_id,
                amount=sponsa_fee,
            )
            await revenue.insert(session=session)
```

> ⚠️ Transactions require a replica set (Atlas M0+ all have this).

---

## Verification Checklist

- [ ] `waitlist` collection: unique email index → duplicate returns error `11000`
- [ ] `creators` uses `Decimal` for `wallet_balance` (stored as `Decimal128`)
- [ ] TTL index on `tips.expiresAt` with `expireAfterSeconds: 0`
- [ ] All indexes visible in Atlas → Collections → Indexes tab
- [ ] Beanie models match document shapes above

---

→ **[Phase 3](./phase-3.md)** — Backend API scaffold and waitlist endpoint.
