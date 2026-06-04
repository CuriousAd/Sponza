# Phase 6 — Environment, Security, Monitoring & Deployment

> **Goal:** Production-ready environment configuration, security hardening, Atlas monitoring, and deployment strategy.

---

## Step 1 — Environment Layout

| Environment | Atlas Cluster | Database Name | URI Storage | Purpose |
|-------------|--------------|---------------|-------------|---------|
| **Local dev** | Same cluster (or M0 free) | `sponsa_dev` | `.env` (gitignored) | Development |
| **Staging** | Same M10 cluster | `sponsa_staging` | Hosting env vars | Pre-production testing |
| **Production** | M10 Mumbai | `sponsa` | Hosting env vars **only** | Live users |

> **Cost tip:** Use one M10 cluster with different database names to save credits.

### Complete Environment Variables

```env
# server/.env
# === Database ===
MONGODB_URI=mongodb+srv://mathelet:PASSWORD@sponsa-prod.jarn7lk.mongodb.net/?appName=sponsa-prod
MONGODB_DB_NAME=sponsa_dev

# === Server ===
PORT=8000
FRONTEND_URL=https://sponsa.in

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

### 2.1 Rate Limiting

```bash
pip install slowapi
```

```python
# server/main.py — add rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

```python
# In routes — decorate endpoints
from slowapi import Limiter
from fastapi import Request

@router.post("/")
@limiter.limit("5/hour")  # waitlist: 5 per IP per hour
async def join_waitlist(request: Request, body: WaitlistCreateRequest):
    ...

@router.post("/create-order")
@limiter.limit("20/minute")  # tips: 20 per IP per minute
async def create_order(request: Request, body: CreateOrderRequest):
    ...
```

### 2.2 Input Sanitization

```bash
pip install bleach
```

```python
# Sanitize donor name and message before DB insert
import bleach

safe_donor_name = bleach.clean(donor_name, tags=[], strip=True)
safe_message = bleach.clean(message, tags=[], strip=True) if message else None
```

### 2.3 Security Checklist (from payments.md)

- [ ] All webhook payloads verified with HMAC-SHA256 before processing
- [ ] Razorpay secret keys in env vars, never in code
- [ ] Wallet deduction in DB transaction (prevent double-spend)
- [ ] Rate limiting on `/api/tip/create-order`
- [ ] UPI ID validated via penny-drop before first withdrawal
- [ ] Minimum withdrawal (₹100) enforced server-side
- [ ] Payout failures auto-refund creator wallet
- [ ] Donor name and message sanitized (prevent XSS)
- [ ] All amounts stored as `Decimal` (not `float`)

---

## Step 3 — Atlas Monitoring & Alerts

### 3.1 Set Up Alerts

**Atlas → Alerts → Create Alert:**

| Alert | Condition | Notification |
|-------|-----------|-------------|
| Cluster down | Host has restarted | Email |
| High connections | > 80% of max | Email |
| Disk usage | > 80% | Email |
| Replication lag | > 10 seconds | Email |
| Credits low | 80% used | Email (set in Billing) |

### 3.2 Day-One Atlas Checklist

| # | Task | Where in Atlas |
|---|------|---------------|
| 1 | Browse collections — confirm `waitlist` after first POST | Database → Browse Collections |
| 2 | Review indexes on each collection | Collections → Indexes tab |
| 3 | Performance Advisor — check after first traffic | Performance Advisor (left nav) |
| 4 | Set up alerts | Alerts (left nav) |
| 5 | Confirm backup schedule (M10) | Backup → Snapshot Schedule |

> **Tip:** Install [MongoDB Compass](https://www.mongodb.com/products/compass) for visual editing.

---

## Step 4 — Deployment

### Backend API (FastAPI)

| Platform | Pros | Pricing |
|----------|------|---------|
| **Railway** | Easy deploys, fixed egress IPs, Python support | Free tier + $5/month |
| **Render** | Auto-deploy from Git, static IPs on paid | Free tier + $7/month |
| **Fly.io** | Edge deployment, Mumbai region available | Free tier + usage-based |

### Deployment files

```dockerfile
# server/Dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```
# server/Procfile (for Railway/Render)
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend (Vite SPA)

| Platform | Notes |
|----------|-------|
| **Vercel** | Zero-config Vite deploy |
| **Netlify** | Similar to Vercel |

### Recommended Setup

```
Frontend: Vercel (sponsa.in)
Backend:  Railway (api.sponsa.in)
Database: Atlas M10 Mumbai
```

---

## Step 5 — Credit-Conscious Operations

| Item | Guidance |
|------|----------|
| **One M10 cluster** | Dev + staging + prod DB names on same cluster |
| **M0 for experiments** | Throwaway tests only |
| **Data transfer** | Keep API in same region as cluster (Mumbai) |
| **Monitoring** | Built-in free metrics are sufficient |

### $500 Credit Math

```
M10 Mumbai:     ~$57/month
Duration:       $500 ÷ $57 ≈ 8.7 months
With backups:   ~$60-65/month → ~7.5 months
```

---

## Step 6 — Implementation Timeline

```
Week 1 — Atlas + Waitlist
  ├── Phase 1: Cluster, user, network
  ├── Phase 2: Collections + indexes
  ├── Phase 3: FastAPI + POST /api/waitlist
  └── Manual approve in Compass

Week 2 — Clerk + Creators
  ├── Phase 4: Clerk setup, webhook, creator collection
  ├── Dashboard reads creator by clerk_user_id
  └── Admin approval flow

Week 3+ — Payments
  ├── Phase 5: Razorpay integration
  ├── Tips, wallet, withdrawals
  └── Phase 6: Security hardening, monitoring
```

---

## Final Verification: End-to-End Flow

- [ ] **Waitlist:** Creator signs up → doc in Atlas → admin approves
- [ ] **Onboarding:** Clerk invite → signup → creator doc created
- [ ] **Dashboard:** Creator logs in → wallet balance, tip feed, copy link
- [ ] **Tipping:** Viewer visits `sponsa.in/{slug}` → Razorpay checkout → pays
- [ ] **Webhook:** `payment.captured` → tip + wallet + revenue updated
- [ ] **Withdrawal:** Creator requests → wallet deducted → Razorpay X payout
- [ ] **Security:** Duplicate webhook = no-op, bad signature = rejected
- [ ] **Monitoring:** Atlas alerts configured, backups running

---

## What You Don't Need Yet

| Feature | When to add |
|---------|------------|
| Second cluster | When traffic demands isolation |
| Sharding | When you exceed M10 capacity |
| Atlas Data Lake | When tip history retention matters |
| Browser → MongoDB directly | **Never** — always via API |

---

> 📚 **Reference docs:**
> - [sponsa.md](./sponsa.md) — Product blueprint
> - [payments.md](./payments.md) — Payments architecture
> - [Phase 1](./phase-1.md) — Atlas setup
> - [Phase 2](./phase-2.md) — Collections & schemas
> - [Phase 3](./phase-3.md) — FastAPI backend scaffold
> - [Phase 4](./phase-4.md) — Clerk authentication
> - [Phase 5](./phase-5.md) — Razorpay payments
