# Phase 6 — Environment, Security, Monitoring & Deployment

> **Goal:** Production-ready environment configuration, security hardening, Atlas monitoring, and deployment strategy.

---

## Step 1 — Environment Layout

| Environment | Atlas Cluster | Database Name | URI Storage | Purpose |
|-------------|--------------|---------------|-------------|---------|
| **Local dev** | Same cluster (or M0 free) | `sponsa_dev` | `.env.local` (gitignored) | Development |
| **Staging** | Same M10 cluster | `sponsa_staging` | Hosting env vars | Pre-production testing |
| **Production** | M10 Mumbai | `sponsa` | Hosting env vars **only** | Live users |

> **Cost tip:** Use one M10 cluster with different database names (`sponsa_dev` / `sponsa_staging` / `sponsa`) to save credits vs. running multiple clusters.

### Complete Environment Variables

```env
# === Database ===
MONGODB_URI=mongodb+srv://sponsa_api:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=sponsa          # or sponsa_dev for local

# === Server ===
PORT=3001
FRONTEND_URL=https://sponsa.in  # or http://localhost:5173 for local
NODE_ENV=production              # or development

# === Clerk ===
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# === Razorpay ===
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=whsec_...
RAZORPAY_X_ACCOUNT_NUMBER=...

# === Admin ===
ADMIN_API_KEY=random-32-char-string
```

```env
# Frontend (.env or .env.production)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_API_URL=https://api.sponsa.in
```

> ⚠️ **Never** put `MONGODB_URI`, `CLERK_SECRET_KEY`, or `RAZORPAY_KEY_SECRET` in any `VITE_*` variable.

---

## Step 2 — Security Hardening

### 2.1 Database Security

| Rule | Implementation |
|------|---------------|
| Unique emails | Unique index on `waitlist.email` and `creators.email` |
| Webhook idempotency | Unique `razorpayPaymentId` on `tips` — duplicate webhooks are no-ops |
| Wallet atomicity | `$inc` in a MongoDB transaction (multi-doc: tips + creators + revenue) |
| Money precision | `Decimal128` in all schemas — never JS `Number` for currency |
| Least privilege | `readWrite` DB user for API; separate `read-only` user for analytics |

### 2.2 API Security

```js
// Rate limiting — install: npm install express-rate-limit
import rateLimit from "express-rate-limit";

// Waitlist: 5 signups per IP per hour
app.use("/api/waitlist", rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many requests, try again later" },
}));

// Tip creation: 20 per IP per minute
app.use("/api/tip/create-order", rateLimit({
  windowMs: 60 * 1000,
  max: 20,
}));
```

### 2.3 Input Sanitization

```js
// Install: npm install xss
import xss from "xss";

// Sanitize donor name and message before DB insert
const safeDonorName = xss(donorName, { whiteList: {} });  // strip all HTML
const safeMessage = xss(message, { whiteList: {} });
```

### 2.4 Security Checklist (from payments.md)

- [ ] All webhook payloads verified with HMAC-SHA256 before processing
- [ ] Razorpay secret keys in env vars, never in code
- [ ] Wallet deduction in DB transaction (prevent double-spend)
- [ ] Rate limiting on `/api/tip/create-order`
- [ ] UPI ID validated via penny-drop before first withdrawal
- [ ] Minimum withdrawal (₹100) enforced server-side
- [ ] Payout failures auto-refund creator wallet
- [ ] Donor name and message sanitized (prevent XSS)
- [ ] All amounts stored consistently (Decimal128)

---

## Step 3 — Atlas Monitoring & Alerts

### 3.1 Built-in Metrics (free)

Navigate to **Atlas → your cluster → Metrics** to monitor:

| Metric | What to watch |
|--------|--------------|
| **Connections** | Should stay under 500 on M10 (max 1500) |
| **Operations/sec** | Baseline for normal traffic |
| **Document Reads/Writes** | Spikes during stream events |
| **Disk IOPS** | Sustained high = need larger tier |
| **Replication Lag** | Should be < 1 second |

### 3.2 Set Up Alerts

**Atlas → Alerts → Create Alert:**

| Alert | Condition | Notification |
|-------|-----------|-------------|
| Cluster down | Host has restarted | Email |
| High connections | > 80% of max | Email |
| Disk usage | > 80% | Email |
| Replication lag | > 10 seconds | Email |
| Credits low | 80% used | Email (set in Billing) |

### 3.3 Performance Advisor

- Atlas → **Performance Advisor** (available on M10+)
- Reviews slow queries and suggests missing indexes
- Check weekly after launch

### 3.4 Backup Verification

- M10 → **Cloud Backup** enabled by default
- Verify snapshot schedule: **Atlas → Backup → Snapshot Schedule**
- Recommended: every 6 hours, retain for 7 days
- Test a restore to a temporary cluster once before launch

---

## Step 4 — Atlas UI Day-One Checklist

| # | Task | Where in Atlas |
|---|------|---------------|
| 4.1 | Browse collections — confirm `waitlist` after first POST | Database → Browse Collections |
| 4.2 | Review indexes on each collection | Collections → Indexes tab |
| 4.3 | Performance Advisor — check after first traffic | Performance Advisor (left nav) |
| 4.4 | Set up alerts | Alerts (left nav) |
| 4.5 | Confirm backup schedule | Backup → Snapshot Schedule |
| 4.6 | Manual data editing (approve waitlist entries) | Data Explorer → Edit Document |

> **Tip:** Install [MongoDB Compass](https://www.mongodb.com/products/compass) (desktop app) with the same URI for visual editing and debugging.

---

## Step 5 — Deployment Options

### Backend API

| Platform | Pros | Pricing | Best for |
|----------|------|---------|----------|
| **Railway** | Easy deploys, built-in env vars, fixed egress IPs | Free tier + $5/month hobby | MVP → production |
| **Render** | Auto-deploy from Git, static IPs on paid | Free tier + $7/month | Simple deploys |
| **Fly.io** | Edge deployment, Mumbai region available | Free tier + usage-based | Low-latency India |
| **Vercel Serverless** | Already using for frontend | Free tier | If API is small |

### Frontend (Vite SPA)

| Platform | Notes |
|----------|-------|
| **Vercel** | Zero-config Vite deploy, great DX |
| **Netlify** | Similar to Vercel |
| **Firebase Hosting** | If using Firebase elsewhere |

### Recommended Setup

```
Frontend: Vercel (sponsa.in)
Backend:  Railway (api.sponsa.in)
Database: Atlas M10 Mumbai
```

---

## Step 6 — Credit-Conscious Operations

| Item | Guidance |
|------|----------|
| **One M10 cluster** | Dev + staging + prod DB names on same cluster until scale demands split |
| **M0 for experiments** | Use for throwaway tests; migrate to M10 before webhooks |
| **Data transfer** | Keep API in same region as cluster (Mumbai `ap-south-1`) to minimize transfer costs |
| **Monitoring** | Built-in free metrics are sufficient; skip paid BI until needed |
| **Atlas Search** | Not needed for waitlist or tipping |
| **Charts / Realm** | Skip unless you build mobile sync |

### $500 Credit Math

```
M10 Mumbai:     ~$57/month
Duration:       $500 ÷ $57 ≈ 8.7 months
With backups:   ~$60-65/month → ~7.5 months
Network egress: Minimal if API is in same region
```

> Confirm exact pricing in [Atlas Pricing Calculator](https://www.mongodb.com/pricing) for your specific configuration.

---

## Step 7 — Implementation Timeline

```
Week 1 — Atlas + Waitlist
  ├── Phase 1: Cluster, user, network (this takes ~1 hour)
  ├── Phase 2: waitlist collection + indexes
  ├── Phase 3: Express API + POST /api/waitlist
  └── Manual approve in Compass / Data Explorer

Week 2 — Clerk + Creators
  ├── Phase 4: Clerk setup, webhook, creator collection
  ├── Dashboard reads creator by clerkUserId
  └── Admin approval flow (API or manual)

Week 3+ — Payments
  ├── Phase 5: Razorpay integration
  ├── Tips, wallet, withdrawals
  └── Phase 6: Security hardening, monitoring
```

---

## Final Verification: End-to-End Flow

After all phases are complete, verify the full flow:

- [ ] **Waitlist:** Viewer signs up → doc appears in Atlas → admin approves
- [ ] **Onboarding:** Approved creator receives Clerk invite → signs up → creator doc created
- [ ] **Dashboard:** Creator logs in → sees wallet balance, tip feed, copy link
- [ ] **Tipping:** Viewer visits `sponsa.in/{slug}` → enters tip → Razorpay checkout → pays
- [ ] **Webhook:** `payment.captured` → tip recorded → wallet credited → revenue tracked
- [ ] **Withdrawal:** Creator requests withdrawal → wallet deducted → Razorpay X payout → money received
- [ ] **Security:** Duplicate webhook = no-op, bad signature = rejected, rate limits active
- [ ] **Monitoring:** Atlas alerts configured, backups running

---

## What You Don't Need Yet

| Feature | When to add |
|---------|------------|
| Second cluster per environment | When traffic demands isolation |
| Sharding | When you exceed M10 capacity (~10k ops/sec) |
| Atlas Data Lake / Online Archive | When tip history retention matters |
| Direct browser → MongoDB access | **Never** — always go through your API |
| Atlas App Services (Realm) | Only if building mobile sync |
| MongoDB Atlas Search | Only if adding full-text search |

---

> 📚 **Reference docs:**
> - [sponsa.md](./sponsa.md) — Product blueprint
> - [payments.md](./payments.md) — Detailed payments architecture
> - [Phase 1](./phase-1.md) — Atlas setup
> - [Phase 2](./phase-2.md) — Collections & schemas
> - [Phase 3](./phase-3.md) — Backend API scaffold
> - [Phase 4](./phase-4.md) — Clerk authentication
> - [Phase 5](./phase-5.md) — Razorpay payments
