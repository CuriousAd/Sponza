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
# In server/
npm install razorpay crypto
```

```js
// server/lib/razorpay.js
import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
```

### Environment Variables

```env
# server/.env.local — add to existing
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxx
RAZORPAY_X_ACCOUNT_NUMBER=2323230012345678
```

---

## Step 2 — Tip Models

```js
// server/models/Tip.js
import mongoose from "mongoose";

const tipSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "Creator", required: true },
  donorName: { type: String, required: true, trim: true, maxlength: 100 },
  message: { type: String, trim: true, maxlength: 500, default: null },
  amount: { type: mongoose.Schema.Types.Decimal128, required: true },
  creatorShare: { type: mongoose.Schema.Types.Decimal128, required: true },
  sponsaFee: { type: mongoose.Schema.Types.Decimal128, required: true },
  razorpayPaymentId: { type: String, unique: true, sparse: true },
  razorpayOrderId: { type: String, required: true },
  sessionId: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
}, { toJSON: { getters: true } });

// Getters for Decimal128 → number
["amount", "creatorShare", "sponsaFee"].forEach(field => {
  tipSchema.path(field).get(v => parseFloat(v?.toString() || "0"));
});

export const Tip = mongoose.model("Tip", tipSchema);
```

```js
// server/models/Withdrawal.js
import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "Creator", required: true },
  amount: {
    type: mongoose.Schema.Types.Decimal128, required: true,
    get: v => parseFloat(v?.toString() || "0"),
  },
  upiId: { type: String, required: true },
  razorpayPayoutId: { type: String, unique: true, sparse: true },
  status: {
    type: String,
    enum: ["pending", "processing", "processed", "failed"],
    default: "pending",
  },
  failureReason: { type: String, default: null },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: null },
}, { toJSON: { getters: true } });

export const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);
```

```js
// server/models/SponSaRevenue.js
import mongoose from "mongoose";

const revenueSchema = new mongoose.Schema({
  tipId: { type: mongoose.Schema.Types.ObjectId, ref: "Tip", required: true, unique: true },
  razorpayPaymentId: { type: String, required: true },
  amount: {
    type: mongoose.Schema.Types.Decimal128, required: true,
    get: v => parseFloat(v?.toString() || "0"),
  },
  recordedAt: { type: Date, default: Date.now },
}, { toJSON: { getters: true } });

export const SponSaRevenue = mongoose.model("SponSaRevenue", revenueSchema);
```

---

## Step 3 — Tip Creation Flow (Viewer Side)

### 3.1 Create Razorpay Order

```js
// server/routes/tip.js
import { Router } from "express";
import { z } from "zod";
import { razorpay } from "../lib/razorpay.js";
import { Creator } from "../models/Creator.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const createOrderBody = z.object({
  creatorSlug: z.string().min(1),
  donorName: z.string().min(1).max(100),
  amount: z.number().min(10).max(50000),  // ₹10 min, ₹50k max
  message: z.string().max(500).optional(),
});

// POST /api/tip/create-order
router.post("/create-order", validate(createOrderBody), async (req, res) => {
  const { creatorSlug, donorName, amount, message } = req.validated;

  // Find creator
  const creator = await Creator.findOne({ slug: creatorSlug, approved: true });
  if (!creator) return res.status(404).json({ error: "Creator not found" });

  // Create Razorpay order
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),  // paise
    currency: "INR",
    receipt: `tip_${creator._id}_${Date.now()}`,
    notes: {
      creator_id: creator._id.toString(),
      donor_name: donorName,
      message: message || "",
    },
  });

  return res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    creatorName: creator.displayName,
  });
});

export default router;
```

### 3.2 Frontend: Open Razorpay Checkout

```js
// src/api/tip.js
export async function createTipOrder({ creatorSlug, donorName, amount, message }) {
  const res = await fetch(`${API_URL}/api/tip/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creatorSlug, donorName, amount, message }),
  });
  return res.json();
}

export function openRazorpayCheckout(orderData, onSuccess) {
  const options = {
    key: orderData.razorpayKeyId,
    amount: orderData.amount,
    currency: orderData.currency,
    order_id: orderData.orderId,
    name: "Sponsa",
    description: `Tip for ${orderData.creatorName}`,
    handler: (response) => onSuccess(response),
    theme: { color: "#6C63FF" },
  };
  const rzp = new window.Razorpay(options);
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

```js
// server/routes/razorpayWebhook.js
import { Router } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import { Tip } from "../models/Tip.js";
import { Creator } from "../models/Creator.js";
import { SponSaRevenue } from "../models/SponSaRevenue.js";
import { Withdrawal } from "../models/Withdrawal.js";

const router = Router();
const Decimal128 = mongoose.Types.Decimal128;

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  // Step 1: Verify HMAC signature
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const expected = crypto
    .createHmac("sha256", secret)
    .update(req.body)
    .digest("hex");

  if (signature !== expected) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  const payload = JSON.parse(req.body);
  const event = payload.event;

  // Step 2: Handle payment.captured (tip received)
  if (event === "payment.captured") {
    const payment = payload.payload.payment.entity;
    const { creator_id, donor_name, message } = payment.notes;

    const tipAmount = payment.amount / 100;        // paise → rupees
    const sponsaFee = tipAmount * 0.10;
    const creatorShare = tipAmount * 0.90;
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    // Idempotency check
    const existing = await Tip.findOne({ razorpayPaymentId: payment.id });
    if (existing) return res.status(200).json({ message: "Already processed" });

    // Atomic transaction: tip + wallet + revenue
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [tip] = await Tip.create([{
        creatorId: creator_id,
        donorName: donor_name,
        message: message || null,
        amount: Decimal128.fromString(tipAmount.toString()),
        creatorShare: Decimal128.fromString(creatorShare.toString()),
        sponsaFee: Decimal128.fromString(sponsaFee.toString()),
        razorpayPaymentId: payment.id,
        razorpayOrderId: payment.order_id,
        timestamp: new Date(),
        expiresAt,
      }], { session });

      await Creator.findByIdAndUpdate(creator_id, {
        $inc: { walletBalance: Decimal128.fromString(creatorShare.toString()) },
      }, { session });

      await SponSaRevenue.create([{
        tipId: tip._id,
        razorpayPaymentId: payment.id,
        amount: Decimal128.fromString(sponsaFee.toString()),
        recordedAt: new Date(),
      }], { session });

      await session.commitTransaction();
      console.log(`✅ Tip processed: ₹${tipAmount} for creator ${creator_id}`);
    } catch (err) {
      await session.abortTransaction();
      console.error("❌ Tip processing failed:", err);
      return res.status(500).json({ error: "Processing failed" });
    } finally {
      session.endSession();
    }
  }

  // Step 3: Handle payout events (withdrawals)
  if (event === "payout.processed") {
    const payout = payload.payload.payout.entity;
    await Withdrawal.findOneAndUpdate(
      { razorpayPayoutId: payout.id },
      { status: "processed", processedAt: new Date() }
    );
  }

  if (event === "payout.failed" || event === "payout.reversed") {
    const payout = payload.payload.payout.entity;
    const withdrawal = await Withdrawal.findOneAndUpdate(
      { razorpayPayoutId: payout.id },
      { status: "failed", failureReason: payout.failure_reason }
    );
    // Refund wallet
    if (withdrawal) {
      await Creator.findByIdAndUpdate(withdrawal.creatorId, {
        $inc: { walletBalance: withdrawal.amount },
      });
    }
  }

  return res.status(200).json({ received: true });
});

export default router;
```

### Register Webhook Route

```js
// server/index.js — add BEFORE express.json()
import razorpayWebhookRoutes from "./routes/razorpayWebhook.js";
app.use("/api/webhooks/razorpay", razorpayWebhookRoutes);
```

### Configure in Razorpay Dashboard

1. **Settings → Webhooks → Add New Webhook**
2. URL: `https://your-api.com/api/webhooks/razorpay`
3. Secret: generate a strong secret → save as `RAZORPAY_WEBHOOK_SECRET`
4. Events: `payment.captured`, `payout.processed`, `payout.failed`, `payout.reversed`

---

## Step 5 — Wallet & Withdrawal Routes

```js
// server/routes/wallet.js
import { Router } from "express";
import { requireAuth } from "@clerk/clerk-sdk-node";
import mongoose from "mongoose";
import { Creator } from "../models/Creator.js";
import { Withdrawal } from "../models/Withdrawal.js";
import { Tip } from "../models/Tip.js";
// import { razorpayX } from "../lib/razorpay.js"; // Razorpay X client

const router = Router();
const Decimal128 = mongoose.Types.Decimal128;

// GET /api/wallet/balance
router.get("/balance", requireAuth(), async (req, res) => {
  const creator = await Creator.findOne({ clerkUserId: req.auth.userId });
  if (!creator) return res.status(404).json({ error: "Creator not found" });
  res.json({ balance: creator.walletBalance });
});

// GET /api/wallet/tips — recent tip feed
router.get("/tips", requireAuth(), async (req, res) => {
  const creator = await Creator.findOne({ clerkUserId: req.auth.userId });
  if (!creator) return res.status(404).json({ error: "Creator not found" });
  const tips = await Tip.find({ creatorId: creator._id })
    .sort({ timestamp: -1 })
    .limit(50);
  res.json(tips);
});

// POST /api/wallet/withdraw
router.post("/withdraw", requireAuth(), async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 100) {
    return res.status(400).json({ error: "Minimum withdrawal is ₹100" });
  }

  const creator = await Creator.findOne({ clerkUserId: req.auth.userId });
  if (!creator) return res.status(404).json({ error: "Creator not found" });
  if (!creator.upiId) return res.status(400).json({ error: "No UPI ID set" });

  const balance = parseFloat(creator.walletBalance?.toString() || "0");
  if (balance < amount) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  // Deduct from wallet immediately
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await Creator.findByIdAndUpdate(creator._id, {
      $inc: { walletBalance: Decimal128.fromString((-amount).toString()) },
    }, { session });

    const withdrawal = await Withdrawal.create([{
      creatorId: creator._id,
      amount: Decimal128.fromString(amount.toString()),
      upiId: creator.upiId,
      status: "pending",
      requestedAt: new Date(),
    }], { session });

    await session.commitTransaction();

    // TODO: Call Razorpay X Payout API here (see payments.md Step 7)
    // On success, update withdrawal with razorpayPayoutId and status: "processing"

    res.json({
      message: "Withdrawal requested",
      withdrawalId: withdrawal[0]._id,
    });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// GET /api/wallet/withdrawals — history
router.get("/withdrawals", requireAuth(), async (req, res) => {
  const creator = await Creator.findOne({ clerkUserId: req.auth.userId });
  if (!creator) return res.status(404).json({ error: "Creator not found" });
  const withdrawals = await Withdrawal.find({ creatorId: creator._id })
    .sort({ requestedAt: -1 });
  res.json(withdrawals);
});

export default router;
```

---

## Step 6 — UPI Verification (Penny Drop)

Before a creator's first withdrawal, verify their UPI ID:

```js
// POST /api/creator/verify-upi
router.post("/verify-upi", requireAuth(), async (req, res) => {
  const { upiId } = req.body;
  if (!upiId) return res.status(400).json({ error: "UPI ID required" });

  // TODO: Call Razorpay X VPA validation API
  // See payments.md Section 5 for the exact API call

  // On success, save the UPI ID
  await Creator.findOneAndUpdate(
    { clerkUserId: req.auth.userId },
    { upiId }
  );

  res.json({ message: "UPI ID verified and saved" });
});
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
- [ ] `GET /api/wallet/balance` returns correct Decimal128 value
- [ ] `POST /api/wallet/withdraw` deducts balance atomically
- [ ] Failed payout → wallet refunded automatically

---

→ **[Phase 6](./phase-6.md)** — Environment management, security hardening, Atlas monitoring, and deployment.
