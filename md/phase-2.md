# Phase 2 — Collections, Schemas & Indexes

> **Goal:** Define every MongoDB collection Sponsa needs, with document shapes, indexes, and validation.

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

## 1. `waitlist` — Build First

### Document Shape

```js
{
  _id: ObjectId,
  email: "creator@example.com",       // unique
  name: "Ronak",
  youtubeUrl: "https://youtube.com/@ronak",
  message: "optional",
  status: "pending",                   // "pending" | "approved" | "rejected"
  createdAt: ISODate,
  updatedAt: ISODate,
  approvedAt: null,
  approvedBy: null,
  clerkInvitationId: null,
  clerkUserId: null
}
```

### Indexes

```js
db.waitlist.createIndex({ email: 1 }, { unique: true });           // no duplicates
db.waitlist.createIndex({ status: 1, createdAt: -1 });             // admin: pending first
db.waitlist.createIndex({ createdAt: -1 });                        // recent signups
```

### Mongoose Schema

```js
// server/models/Waitlist.js
import mongoose from "mongoose";

const waitlistSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  youtubeUrl: { type: String, required: true, trim: true },
  message: { type: String, trim: true, maxlength: 500, default: null },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  approvedAt: { type: Date, default: null },
  approvedBy: { type: String, default: null },
  clerkInvitationId: { type: String, default: null },
  clerkUserId: { type: String, default: null }
}, { timestamps: true });

export const Waitlist = mongoose.model("Waitlist", waitlistSchema);
```

---

## 2. `creators` — When Clerk Goes Live

### Document Shape

```js
{
  _id: ObjectId,
  clerkUserId: "user_2abc123",         // unique, from Clerk
  email: "creator@example.com",        // unique
  slug: "ronak",                       // unique → sponsa.in/ronak
  displayName: "Ronak",
  avatarUrl: null,
  youtubeUrl: "https://youtube.com/@ronak",
  upiId: null,                         // set by creator in settings
  walletBalance: Decimal128("0.00"),    // ⚠️ Decimal128, not Number
  approved: true,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### Indexes

```js
db.creators.createIndex({ clerkUserId: 1 }, { unique: true });
db.creators.createIndex({ email: 1 }, { unique: true });
db.creators.createIndex({ slug: 1 }, { unique: true });
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

### Document Shape

```js
{
  _id: ObjectId,
  creatorId: ObjectId,                  // ref → creators._id
  donorName: "Raj",
  message: "Great stream!",
  amount: Decimal128("100.00"),         // full tip
  creatorShare: Decimal128("90.00"),    // 90%
  sponsaFee: Decimal128("10.00"),       // 10%
  razorpayPaymentId: "pay_ABC123",     // unique
  razorpayOrderId: "order_XYZ789",
  sessionId: null,
  timestamp: ISODate,
  expiresAt: ISODate                   // timestamp + 72h
}
```

### Indexes

```js
db.tips.createIndex({ creatorId: 1, timestamp: -1 });              // dashboard feed
db.tips.createIndex({ razorpayPaymentId: 1 }, { unique: true });   // idempotent webhooks
db.tips.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });  // TTL: auto-delete after 72h
```

> **TTL explained:** MongoDB background task auto-deletes docs when `expiresAt` passes. Set `expiresAt = timestamp + 72h` on insert. No cron needed.

> ⚠️ If you need tip history for tax/analytics, skip the TTL index and archive manually.

---

## 4. `withdrawals`

```js
{
  _id: ObjectId,
  creatorId: ObjectId,
  amount: Decimal128("500.00"),
  upiId: "ronak@upi",
  razorpayPayoutId: "pout_DEF456",
  status: "pending",                   // "pending"|"processing"|"processed"|"failed"
  failureReason: null,
  requestedAt: ISODate,
  processedAt: null
}
```

### Indexes

```js
db.withdrawals.createIndex({ creatorId: 1, requestedAt: -1 });
db.withdrawals.createIndex({ razorpayPayoutId: 1 }, { unique: true, sparse: true });
db.withdrawals.createIndex({ status: 1 });
```

---

## 5. `sponsa_revenue`

```js
{
  _id: ObjectId,
  tipId: ObjectId,
  razorpayPaymentId: "pay_ABC123",
  amount: Decimal128("10.00"),
  recordedAt: ISODate
}
```

### Indexes

```js
db.sponsa_revenue.createIndex({ tipId: 1 }, { unique: true });
db.sponsa_revenue.createIndex({ recordedAt: -1 });
```

---

## Critical: Money Type & Transactions

### Why Decimal128

```js
// ❌ JS Number: 0.1 + 0.2 = 0.30000000000000004
// ✅ Decimal128: exact decimal arithmetic for money

walletBalance: mongoose.Types.Decimal128.fromString("90.00")
```

### Multi-Document Transactions (wallet updates)

When a tip arrives, update 3 collections atomically:

```js
const session = await mongoose.startSession();
session.startTransaction();
try {
  await Tip.create([{ ...tipData }], { session });
  await Creator.findByIdAndUpdate(creatorId,
    { $inc: { walletBalance: Decimal128.fromString(creatorShare) } },
    { session }
  );
  await SponSaRevenue.create([{ tipId, amount: sponsaFee, recordedAt: new Date() }], { session });
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}
```

---

## Verification Checklist

- [ ] `waitlist` collection: unique email index → duplicate returns error `11000`
- [ ] `creators` uses `Decimal128` for `walletBalance`
- [ ] TTL index on `tips.expiresAt` with `expireAfterSeconds: 0`
- [ ] All indexes visible in Atlas → Collections → Indexes tab
- [ ] Mongoose schemas match document shapes above

---

→ **[Phase 3](./phase-3.md)** — Backend API scaffold and waitlist endpoint.
