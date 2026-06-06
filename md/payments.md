# Sponsa — Payments Architecture & Flow (Cashfree Edition)

> Complete reference for how money moves through Sponsa: from viewer tip to creator withdrawal, built on Cashfree's EasySplit nodal architecture.

---

## 1. Overview

Sponsa uses **Cashfree EasySplit & Payouts** to implement a split-settlement merchant flow. All viewer payments land in Sponsa's Cashfree account, but are instantly split at ingestion:
- **90%** is routed directly to the creator's isolated Cashfree Virtual Vault.
- **10%** is routed to Sponsa's corporate account.

Real money is disbursed from the creator's Virtual Vault to their personal UPI ID when they request a withdrawal.

This architecture ensures Sponsa **never holds viewer capital** in its own bank account, remaining fully compliant with the Reserve Bank of India (RBI) Payment Aggregator (PA) guidelines.

---

## 2. Payment Gateway Stack

Sponsa integrates three Cashfree modules:

| Product | Purpose |
|---|---|
| **Cashfree Payment Gateway** | Collects payments (UPI, Cards) from viewers |
| **Cashfree EasySplit** | Splits transaction revenue at the point of ingestion (90/10 split) |
| **Cashfree Payouts** | Transfers creator funds from their Virtual Vault to their personal UPI ID |

### Why Cashfree?

- **Compliance:** EasySplit prevents Sponsa from acting as an unlicensed Payment Aggregator.
- **Frictionless Mobile UPI:** Native UPI intent-switching for mobile browsers.
- **Async Execution:** Clean webhooks with HMAC-SHA256 signature verification.
- **Instant Transfers:** Cashfree Payouts supports 24/7 instant UPI transfers.

### Fee Structure

| Fee Type | Amount |
|---|---|
| Cashfree collection fee | ~2% per transaction |
| Cashfree payout fee | ₹2–5 flat per payout |
| Sponsa platform fee | 10% of tip amount |
| Creator receives | 90% of tip amount (deposited in Virtual Vault) |

**Net example on a ₹100 tip:**
- Viewer pays **₹100**.
- Cashfree captures ₹100 and applies the split:
  - **₹90** goes to the Creator's Virtual Vault.
  - **₹10** goes to Sponsa's fee account.
- Razorpay/Cashfree fees are settled out of Sponsa's fee account.

---

## 3. Full Money Flow — Step by Step

### Step 1 — Viewer submits tip form
Viewer enters name, amount, and message on `sponsa.in/{creator}` and clicks **Pay via UPI**.

### Step 2 — Backend creates Cashfree Order
Your server creates a split order via Cashfree Orders API:
```python
# POST /api/tip/create-order
# Declare the split configuration at order creation time
order = await cashfree.create_order(
    order_id=f"sponsa_ord_{int(time.time())}",
    amount=tip_amount,
    customer_name=donor_name,
    vendor_splits=[{
        "vendor_id": creator.cashfree_vendor_id,
        "percentage": 90.0,
    }]
)
# Returns payment_session_id to frontend
```

### Step 3 — Viewer completes payment
The frontend checkout SDK triggers native UPI intent switching on mobile or a QR modal on desktop. Viewer pays using any UPI app (GPay, PhonePe, Paytm).

### Step 4 — Cashfree fires `order.payment.captured` Webhook
Cashfree POSTs a verified signature webhook.
```python
# Webhook verification
sign_str = timestamp + raw_request_body
expected = hmac.new(
    settings.cashfree_webhook_secret.encode(),
    sign_str.encode(),
    hashlib.sha256
).digest()
generated_sig = base64.b64encode(expected).decode()

if not hmac.compare_digest(generated_sig, received_sig):
    raise HTTPException(status_code=400, detail="Invalid signature")
```

### Step 5 — Backend records the tip (DB only, money is already split)
On verified webhook, the backend records the transaction to the database and atomically increments the creator's virtual balance ledger:
```python
# 1. Insert tip document (unique index on cashfree_payment_id prevents double-processing)
await Tip(
    creator_id=creator.id,
    donor_name=donor_name,
    message=message,
    amount=tip_amount,
    creator_share=creator_share,
    sponsa_fee=sponsa_fee,
    cashfree_payment_id=payment_id,
).insert()

# 2. Increment wallet balance ledger
await db.creators.update_one(
    {"_id": creator.id},
    {"$inc": {"wallet_balance": Decimal128(str(creator_share))}}
)
```

### Step 6 — Creator requests withdrawal
Creator goes to dashboard, clicks **Withdraw**, enters amount (min ₹100).
1. Deduct amount from DB wallet ledger immediately (lock funds).
2. Create withdrawal record with status `pending`.

### Step 7 — Cashfree Payout API call
Call Cashfree Payouts to initiate transfer from the creator's Virtual Vault to their UPI:
```python
payout = await cashfree.initiate_payout(
    vendor_id=creator.cashfree_vendor_id,
    amount=requested_amount,
    upi_vpa=creator.upi_id,
    transfer_id=f"withdrawal_{withdrawal.id}"
)
```

### Step 8 — Payout Webhook
Listen for payout callback webhooks:
- `payout.processed`: Update withdrawal status to `processed`.
- `payout.failed`: Refund creator's database wallet balance, update withdrawal status to `failed`.

---

## 4. KYC & Vendor Onboarding

Every creator must be onboarded as a Cashfree EasySplit **vendor**. 

### Minimum KYC Requirements:
- **Individual:** PAN + Address Proof (Aadhaar / Voter ID / DL / Passport).
- **Bank Account / UPI VPA:** Verified via penny-drop validation before any payouts.

---

## 5. Database Schema (Payments-Related Collections)

### `creators`
```json
{
  "_id": "ObjectId",
  "google_id": "google_12345",
  "email": "creator@example.com",
  "slug": "ronak",
  "display_name": "Ronak",
  "cashfree_vendor_id": "vend_ronak_123",
  "upi_id": "ronak@okaxis",
  "upi_verified": true,
  "wallet_balance": "Decimal128(0.00)"
}
```

### `tips`
```json
{
  "_id": "ObjectId",
  "creator_id": "ObjectId",
  "donor_name": "Raj",
  "message": "Love the stream!",
  "amount": "Decimal128(100.00)",
  "creator_share": "Decimal128(90.00)",
  "sponsa_fee": "Decimal128(10.00)",
  "cashfree_payment_id": "cf_pay_9923849283",
  "cashfree_order_id": "sponsa_ord_23847293",
  "timestamp": "ISODate"
}
```

### `withdrawals`
```json
{
  "_id": "ObjectId",
  "creator_id": "ObjectId",
  "amount": "Decimal128(500.00)",
  "upi_id": "ronak@okaxis",
  "cashfree_transfer_id": "cf_txn_284792384",
  "status": "pending", // pending, processing, processed, failed
  "requested_at": "ISODate",
  "processed_at": null
}
```

---

## 6. API Endpoints Required

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/tip/create-order` | Create Cashfree order for viewer |
| `POST` | `/api/webhooks/cashfree` | Receive payment + payout webhooks |
| `GET` | `/api/wallet/balance` | Fetch wallet balance |
| `POST` | `/api/wallet/withdraw` | Request payout |
| `GET` | `/api/wallet/withdrawals` | Payout history |
| `POST` | `/api/creator/verify-upi` | Verify UPI ID |