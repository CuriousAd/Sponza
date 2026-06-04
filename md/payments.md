# Sponsa — Payments Architecture & Flow

> Complete reference for how money moves through Sponsa: from viewer tip to creator withdrawal.

---

## 1. Overview

Sponsa uses **Model B — Merchant Account Flow**. All viewer payments land in Sponsa's own Razorpay merchant account first. The platform takes its cut (tracked as a DB entry), and the creator's net share is credited to their Sponsa wallet. Real money only leaves Sponsa's account when a creator initiates a withdrawal.

This is the same model used by Patreon, Buy Me a Coffee, and StreamElements.

---

## 2. Payment Gateway Stack

Sponsa uses two Razorpay products under one business account:

| Product | Purpose |
|---|---|
| **Razorpay Payment Gateway** | Collects UPI payments from viewers |
| **Razorpay X (Payouts)** | Sends withdrawals from Sponsa's balance to creator UPI/bank |

### Why Razorpay?

- Both collection and disbursement live under one API and one dashboard
- Best-in-class developer documentation among Indian gateways
- Reliable webhooks with HMAC-SHA256 signature verification
- Sandbox/test mode available before going live
- Supports UPI, QR, payment links, and order-based flows
- Razorpay X Payouts supports instant UPI transfers (typically 1–30 mins)

### Fee Structure

| Fee Type | Amount |
|---|---|
| Razorpay collection fee | ~2% per transaction |
| Razorpay X payout fee | ₹2–5 flat per payout |
| Sponsa platform fee | 10% of tip amount |
| Creator receives | 90% of tip amount |

**Net example on a ₹100 tip:**

| Party | Amount |
|---|---|
| Razorpay collection fee | −₹2 |
| Creator wallet credited | ₹90 |
| Sponsa profit | ₹8 (₹10 cut − ₹2 gateway fee) |
| **Total** | **₹100 ✓** |

---

## 3. Full Money Flow — Step by Step

### Step 1 — Viewer submits tip form

Viewer enters name, amount, optional message on `sponsa.in/{creator}` and clicks **Pay via UPI**.

### Step 2 — Backend creates Razorpay Order

Your server creates an order via Razorpay Orders API:

```js
// POST /api/tip/create-order
const order = await razorpay.orders.create({
  amount: tipAmount * 100,   // in paise
  currency: "INR",
  receipt: `tip_${creatorId}_${Date.now()}`,
  notes: {
    creator_id: creatorId,
    donor_name: donorName,
    message: donorMessage
  }
});
// Return order.id to frontend
```

The frontend uses this `order_id` to open the Razorpay checkout modal.

### Step 3 — Razorpay collects the payment

Razorpay handles the actual UPI transaction — QR code, UPI ID, or payment app redirect. Their servers collect the ₹100 from the viewer. Razorpay deducts their ~2% fee and credits ₹98 to **Sponsa's Razorpay merchant balance**.

### Step 4 — Razorpay fires a webhook

On successful payment, Razorpay POSTs a `payment.captured` event to your webhook endpoint (e.g. `https://api.sponsa.in/webhooks/razorpay`).

**Critical:** Never trust the frontend to confirm payment. Always verify server-side via webhook.

```js
// Webhook verification
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
const signature = req.headers['x-razorpay-signature'];
const expectedSig = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature !== expectedSig) {
  return res.status(400).send('Invalid signature');
}
```

### Step 5 — Backend records the split (DB only, no money moves)

On verified webhook, your backend records the accounting split in the database:

```js
const tipAmount = payload.payment.entity.amount / 100; // paise → rupees
const sponsaCut = tipAmount * 0.10;
const creatorShare = tipAmount * 0.90;

await db.transaction(async (trx) => {
  // Record the tip
  await trx('tips').insert({
    creator_id: creatorId,
    donor_name: donorName,
    message: donorMessage,
    amount: tipAmount,
    creator_share: creatorShare,
    sponsa_fee: sponsaCut,
    razorpay_payment_id: paymentId,
    timestamp: new Date()
  });

  // Credit creator wallet (just a DB number)
  await trx('users')
    .where({ id: creatorId })
    .increment('wallet_balance', creatorShare);

  // Record Sponsa revenue (stays in your Razorpay balance)
  await trx('sponsa_revenue').insert({
    payment_id: paymentId,
    amount: sponsaCut,
    recorded_at: new Date()
  });
});
```

At this point:
- ₹98 is **physically in your Razorpay merchant balance**
- Creator's `wallet_balance` in DB shows +₹90 (a number, not real money)
- Sponsa's ₹10 cut stays in your Razorpay balance forever — it never moves

### Step 6 — Creator requests withdrawal

Creator goes to their dashboard, clicks **Withdraw to UPI**, enters amount (subject to minimum ₹100).

```js
// POST /api/wallet/withdraw
// Validate: wallet_balance >= requestedAmount

// 1. Deduct from DB wallet immediately (lock the funds)
await db('users')
  .where({ id: creatorId })
  .decrement('wallet_balance', requestedAmount);

// 2. Create withdrawal record
const withdrawal = await db('withdrawals').insert({
  creator_id: creatorId,
  amount: requestedAmount,
  upi_id: creator.upi_id,
  status: 'pending',
  requested_at: new Date()
});
```

### Step 7 — Razorpay X Payout API call

Your backend calls Razorpay X to send the actual money:

```js
const payout = await razorpayX.payouts.create({
  account_number: process.env.RAZORPAY_X_ACCOUNT_NUMBER,
  fund_account: {
    account_type: "vpa",           // VPA = UPI address
    vpa: { address: creator.upi_id },
    contact: {
      name: creator.name,
      type: "vendor"
    }
  },
  amount: requestedAmount * 100,  // paise
  currency: "INR",
  mode: "UPI",
  purpose: "payout",
  narration: "Sponsa withdrawal",
  reference_id: `withdrawal_${withdrawalId}`
});
```

Razorpay X pulls `requestedAmount` from **Sponsa's Razorpay X balance** and transfers it to the creator's UPI. This is where real money leaves your account.

### Step 8 — Payout webhook confirms transfer

Razorpay fires a `payout.processed` or `payout.failed` webhook:

```js
if (event === 'payout.processed') {
  await db('withdrawals')
    .where({ id: withdrawalId })
    .update({ status: 'processed', processed_at: new Date() });
}

if (event === 'payout.failed') {
  // Refund the wallet balance
  await db('users')
    .where({ id: creatorId })
    .increment('wallet_balance', requestedAmount);
  await db('withdrawals')
    .where({ id: withdrawalId })
    .update({ status: 'failed' });
}
```

---

## 4. What Lives Where

| What | Where it lives |
|---|---|
| Viewer's ₹100 payment | Razorpay merchant balance (Sponsa's account) |
| Creator's ₹90 wallet | Database number (`users.wallet_balance`) |
| Sponsa's ₹10 cut | Stays in Razorpay balance — never transferred |
| Withdrawn ₹90 | Physically leaves via Razorpay X to creator UPI |
| Razorpay's ₹2 fee | Deducted by Razorpay before settlement |

**Key insight:** The wallet is an IOU. Sponsa owes the creator ₹90 and holds it in their Razorpay balance until the creator withdraws. Your Razorpay balance always contains: all unclaimed creator wallets + all Sponsa revenue.

---

## 5. KYC Requirements

### Sponsa (you) — required before going live

| Requirement | Details |
|---|---|
| Business registration | Proprietorship, LLP, or Pvt Ltd |
| PAN card | Business or personal (proprietorship) |
| Bank account | Linked to Razorpay for settlements |
| Razorpay X onboarding | Separate activation for Payouts product |
| GST | Optional at MVP stage, required if turnover > ₹20L/year |

Apply at: [razorpay.com/x](https://razorpay.com/x) — typically 2–5 business days for approval.

### Creators — minimal requirements

Creators do **not** need to complete KYC with Sponsa. Since you are the merchant of record and you are paying them (not a payment gateway paying them), no RBI-mandated KYC is required on the recipient.

**You should still verify their UPI ID** using Razorpay's penny-drop / VPA validation API before allowing the first withdrawal — this confirms the UPI address exists and belongs to a real account.

```js
// Verify UPI ID before saving
const verification = await razorpayX.fundAccount.validate({
  account_number: process.env.RAZORPAY_X_ACCOUNT_NUMBER,
  fund_account: {
    account_type: "vpa",
    vpa: { address: creatorUpiId }
  },
  amount: 100,   // ₹1 penny drop
  currency: "INR"
});

if (verification.results.account_status !== "active") {
  throw new Error("Invalid UPI ID");
}
```

---

## 6. Minimum Withdrawal Policy

Recommended minimums to keep payout fees economically viable:

| Setting | Recommended value |
|---|---|
| Minimum withdrawal | ₹100 |
| Razorpay payout flat fee | ~₹3–5 per transfer |
| Your cost at ₹100 withdrawal | ~3–5% of payout (acceptable) |
| Your cost at ₹10 withdrawal | ~30–50% of payout (unacceptable) |

---

## 7. Database Schema (Payments-related tables)

```sql
-- Creator account
users (
  id              UUID PRIMARY KEY,
  name            TEXT,
  email           TEXT UNIQUE,
  upi_id          TEXT,
  wallet_balance  DECIMAL(10,2) DEFAULT 0.00,
  created_at      TIMESTAMP
)

-- Individual tips received
tips (
  id                    UUID PRIMARY KEY,
  creator_id            UUID REFERENCES users(id),
  donor_name            TEXT,
  message               TEXT,
  amount                DECIMAL(10,2),   -- full tip amount
  creator_share         DECIMAL(10,2),   -- 90%
  sponsa_fee            DECIMAL(10,2),   -- 10%
  razorpay_payment_id   TEXT UNIQUE,
  razorpay_order_id     TEXT,
  session_id            TEXT,
  timestamp             TIMESTAMP,
  expires_at            TIMESTAMP        -- 72hr auto-purge
)

-- Creator withdrawal requests
withdrawals (
  id              UUID PRIMARY KEY,
  creator_id      UUID REFERENCES users(id),
  amount          DECIMAL(10,2),
  upi_id          TEXT,
  razorpay_payout_id  TEXT,
  status          ENUM('pending', 'processing', 'processed', 'failed'),
  requested_at    TIMESTAMP,
  processed_at    TIMESTAMP
)

-- Sponsa internal revenue tracking
sponsa_revenue (
  id              UUID PRIMARY KEY,
  tip_id          UUID REFERENCES tips(id),
  amount          DECIMAL(10,2),
  recorded_at     TIMESTAMP
)
```

---

## 8. API Endpoints Required

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/tip/create-order` | Create Razorpay order for viewer |
| `POST` | `/webhooks/razorpay` | Receive payment + payout webhooks |
| `GET` | `/api/wallet/balance` | Creator fetches their wallet balance |
| `POST` | `/api/wallet/withdraw` | Creator requests withdrawal |
| `GET` | `/api/wallet/withdrawals` | Creator views withdrawal history |
| `POST` | `/api/creator/verify-upi` | Penny-drop UPI verification on signup |

---

## 9. Security Checklist

- [ ] All webhook payloads verified with HMAC-SHA256 before processing
- [ ] Razorpay secret keys stored in environment variables, never in code
- [ ] Wallet deduction happens in a DB transaction (prevent double-spend)
- [ ] Rate limiting on `/api/tip/create-order` (prevent spam orders)
- [ ] UPI ID validated via penny-drop before first withdrawal
- [ ] Minimum withdrawal amount enforced server-side (not just frontend)
- [ ] Payout failures automatically refund the creator wallet
- [ ] Donor name and message sanitized before DB insert (prevent XSS)
- [ ] All payment amounts stored in paise internally, converted only for display

---

## 10. Razorpay Resources

| Resource | Link |
|---|---|
| Razorpay Orders API docs | https://razorpay.com/docs/payments/orders |
| Razorpay Webhooks guide | https://razorpay.com/docs/webhooks |
| Razorpay X Payouts API | https://razorpay.com/docs/razorpay-x/payouts |
| VPA (UPI) validation | https://razorpay.com/docs/razorpay-x/fund-accounts/validate |
| Test credentials | https://razorpay.com/docs/payments/payments/test-card-details |
| Business onboarding | https://dashboard.razorpay.com/signup |

---

*Last updated: June 2026 — Sponsa payments architecture v1.0*