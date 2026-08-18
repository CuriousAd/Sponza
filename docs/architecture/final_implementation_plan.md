# Sponza — Final Implementation Plan

> **A real-time UPI tipping platform for Indian YouTube live streamers**, built to replace the 30% Super Chat tax with a 5–10% fee using Cashfree's split-settlement architecture.

---

## Part 1 — Vision, Progress & Gap Analysis

### 1.1 What We're Building & For Whom

**Sponza** is a high-volume, real-time payment platform purpose-built for **Indian YouTube Live creators**. It solves a single, sharp problem: YouTube Super Chat takes a 30% cut from every live-stream tip. Sponza reduces that to 5–10%, putting ₹90+ of every ₹100 directly into the creator's wallet.

**Target Users:**

| Persona | Role | Key Need |
| :--- | :--- | :--- |
| **Creator** (Streamer) | Signs in with Google, shares a unique tip link, sees alerts on OBS | Keep 90%+ of tips, instant UPI withdrawal |
| **Viewer** (Tipper) | Opens creator's link, enters name + amount + message, pays via UPI | Sub-30-second payment experience, no app install |
| **Platform** (Sponza) | Orchestrates payments, handles compliance, displays overlays | Collect 10% platform fee, scale to thousands of concurrent streams |

**Core Value Proposition:**

```
Viewer pays ₹100 via UPI
  → ₹90 goes to Creator's Cashfree Virtual Vault (instant)
  → ₹10 goes to Sponza (platform fee)
  → Creator withdraws ₹90 to personal UPI anytime
```

---

### 1.2 Implementation Status — What's Done

| Layer | Component | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Monorepo** | `backend/` + `frontend/` structure | ✅ Done | Clean separation, root orchestration via `dev.ps1` |
| **Backend Scaffold** | FastAPI + Beanie/Motor + Pydantic Settings | ✅ Done | Vertical-slice modules, lifespan DB init |
| **Config & Secrets** | `config.py`, `.env.example`, `.gitignore` | ✅ Done | All Cashfree + Google + MongoDB vars declared |
| **Google OAuth** | `auth/router.py` + `auth/service.py` | ✅ Done | Full flow: redirect → callback → JWT cookie → creator upsert |
| **Creator Model** | `creators/models.py` | ✅ Done | `google_id`, `slug`, `obs_token`, `cashfree_vendor_id`, `wallet_balance` |
| **Tip Model** | `payments/models.py` | ✅ Done | `Tip` + `SponzaRevenue` with unique index on `cashfree_payment_id` |
| **Webhook Model** | `webhooks/models.py` | ✅ Done | `WebhookEvent` audit log with idempotency status tracking |
| **Withdrawal Model** | `wallet/models.py` | ✅ Done | `Withdrawal` with `WithdrawalStatus` enum |
| **Cashfree Client** | `integrations/cashfree/client.py` | ✅ Done | `create_order()`, `create_vendor()`, `initiate_payout()` |
| **Webhook Handler** | `webhooks/router.py` + `webhooks/service.py` | ✅ Done | HMAC-SHA256 verify → persist → background enqueue |
| **Tip Processor** | `payments/processor.py` | ✅ Done | Semaphore-bounded, idempotent, atomic `$inc` wallet |
| **Wallet & Withdrawals** | `wallet/router.py` + `wallet/service.py` | ✅ Done | Balance, tips feed, withdrawal with payout call |
| **WebSocket Manager** | `overlay/manager.py` + `overlay/router.py` | ✅ Done | `ConnectionManager` with fan-out broadcast |
| **Security** | `core/security.py` | ✅ Done | JWT, HMAC verify, `bleach` sanitization |
| **Middleware** | `core/middleware.py` | ✅ Done | CORS, rate limiting via `slowapi` |
| **Frontend — Landing** | `features/landing/HomePage.tsx` | ✅ Done | Hero, features, footer with Sponza branding |
| **Frontend — Auth** | `features/auth/AuthPage.tsx` | ✅ Done | Google OAuth redirect, demo session fallback |
| **Frontend — Dashboard** | `features/dashboard/DashboardPage.tsx` | ✅ Done | Session control, links, live feed, wallet, quick stats |
| **Frontend — Tip Page** | `features/tip/TipPage.tsx` | ✅ Done | Donor form, quick amounts, UPI button, BroadcastChannel |
| **Frontend — Overlay** | `features/overlay/OverlayPage.tsx` | ✅ Done | WebSocket + BroadcastChannel, tiered animations |
| **CI/CD** | Husky + lint-staged + ESLint v9 | ✅ Done | Pre-commit linting on frontend `*.ts/*.tsx` |
| **Docker** | `docker-compose.yml` + Dockerfiles | ✅ Done | MongoDB 7 + backend + frontend services |
| **Git & Repo** | GitHub `CuriousAd/Sponza` on `main` | ✅ Done | Clean history, no secrets committed |

---

### 1.3 What's Left — Critical Gaps

> [!IMPORTANT]
> The codebase has all the **structural scaffolding** in place, but the payment pipeline has never been tested against a live Cashfree sandbox. The gaps below are the delta between "compiles and builds" and "processes real money."

| # | Gap | Severity | Description |
| :--- | :--- | :---: | :--- |
| **G1** | Cashfree Sandbox E2E Test | 🔴 Critical | No order has been created, no webhook received, no split verified against the sandbox API |
| **G2** | EasySplit Vendor Onboarding Flow | 🔴 Critical | `create_vendor()` exists but no UI flow for creators to submit KYC (PAN + address proof) |
| **G3** | Cashfree JS Checkout SDK | 🔴 Critical | Frontend `TipPage.tsx` calls `createTipOrder()` but does not load the Cashfree JS SDK to render the actual UPI payment sheet |
| **G4** | Payout Webhook Listener | 🟡 High | We handle `order.payment.captured` but not `payout.processed` / `payout.failed` callbacks for withdrawal status updates |
| **G5** | Creator Onboarding UX | 🟡 High | After Google sign-in, creators need a guided flow: Enter UPI → Verify (penny-drop) → Submit KYC → Activate |
| **G6** | Cashfree Production Keys | 🟡 High | Currently configured for sandbox only; production requires separate key activation |
| **G7** | Task Queue Durability | 🟡 Medium | Current `BackgroundTasks` + `asyncio.Semaphore` loses queued work on server restart (acceptable for MVP, not for scale) |
| **G8** | Frontend Cashfree SDK Types | 🟡 Medium | No TypeScript types or SDK wrapper for `@cashfreepayments/cashfree-js` |
| **G9** | MongoDB Atlas Production | 🟢 Low | Local Docker MongoDB works; needs Atlas M10+ Mumbai cluster for production |
| **G10** | Heroku Deployment Config | 🟢 Low | `Procfile` exists but untested on Heroku; WebSocket support needs verification |

---

## Part 2 — Cashfree Integration Deep Dive & Scaling Strategy

### 2.1 Cashfree Gateway Architecture — Current State

Our integration uses **three Cashfree products**:

```
┌─────────────────────────────────────────────────────────┐
│                    CASHFREE STACK                        │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Payment     │  │  EasySplit   │  │   Payouts    │  │
│  │  Gateway     │──│  (Split at   │  │  (Withdrawal │  │
│  │  (Collect)   │  │   capture)   │  │   to UPI)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│    UPI/Cards         90% → Vault       Vault → UPI     │
│    from Viewer       10% → Sponza      to Creator      │
└─────────────────────────────────────────────────────────┘
```

**Is it already configured?**

| Component | Configured? | Details |
| :--- | :---: | :--- |
| `CashfreeClient.create_order()` | ✅ Yes | Creates orders with `order_splits` for EasySplit vendor |
| `CashfreeClient.create_vendor()` | ✅ Yes | Registers creators as EasySplit vendors with UPI VPA |
| `CashfreeClient.initiate_payout()` | ✅ Yes | Transfers from vault to creator's UPI via Payouts API |
| `verify_cashfree_signature()` | ✅ Yes | HMAC-SHA256 verification in `core/security.py` |
| Sandbox API Keys | ✅ Yes | Declared in `.env.example` and `config.py` |
| Production API Keys | ❌ No | Requires Cashfree dashboard activation |
| EasySplit Feature Flag | ❌ No | Must be enabled by Cashfree account manager (2-5 business days) |
| Cashfree JS Checkout SDK | ❌ No | Frontend doesn't load the SDK; uses demo BroadcastChannel instead |

---

### 2.2 How Industry Leaders Handle Streaming Payments at Scale

> Understanding the architectural patterns used by YouTube Super Chat, Streamlabs, StreamElements, and SuperTip to build our scaling roadmap.

#### Pattern 1: Event-Driven Ingest → Process → Notify

Every major platform follows this three-stage pipeline:

```
                    ┌───────────┐
Viewer pays ────────│  INGEST   │──── Return 200 in <50ms
                    │  (thin)   │
                    └─────┬─────┘
                          │  async event
                    ┌─────▼─────┐
                    │  PROCESS  │──── Idempotent DB writes
                    │  (worker) │     Wallet ledger update
                    └─────┬─────┘
                          │  push
                    ┌─────▼─────┐
                    │  NOTIFY   │──── WebSocket to OBS
                    │  (fan-out)│     Dashboard live feed
                    └───────────┘
```

**YouTube Super Chat** benefits from Google's internal Pub/Sub and Spanner infrastructure. Chat messages (including Super Chats) are fanned out through a proprietary real-time messaging layer tightly coupled with their video CDN, guaranteeing sub-second latency even at millions of concurrent viewers.

**Streamlabs/StreamElements** use Stripe/PayPal as the payment rail, then push events through **message brokers** (Kafka/Redis Streams) to worker pools that handle:
1. Database persistence
2. Fee calculation
3. WebSocket notification to the streamer's browser source

#### Pattern 2: Split-at-Ingestion (What Sponza Uses)

Most platforms collect 100% of funds into their merchant account and then periodically settle with creators. This requires a **Payment Aggregator (PA) license** from the RBI.

**Sponza's advantage**: By using Cashfree EasySplit, we split at the moment of payment capture. The creator's 90% never touches Sponza's bank account — it goes directly to their Cashfree Virtual Vault. This eliminates the PA license requirement and simplifies compliance.

#### Pattern 3: Horizontal Worker Scaling

| Scale Tier | Concurrent Streams | Tip Throughput | Infrastructure |
| :--- | :--- | :--- | :--- |
| **MVP** (where we are) | 1–50 | ~10 tips/sec | Single Heroku dyno, BackgroundTasks |
| **Growth** | 50–500 | ~100 tips/sec | 2–4 Gunicorn workers, Redis-backed ARQ queue |
| **Scale** | 500–5,000 | ~1,000 tips/sec | Kubernetes pods, Kafka/Redis Streams, sharded MongoDB |

---

### 2.3 Sponza's Production Scaling Roadmap

#### Phase 1 — MVP (Current → First 50 Creators)

**Architecture: Monolith with bounded concurrency**

```
Heroku (1 Standard-2X Dyno)
├── Gunicorn + 4 UvicornWorkers
│   ├── FastAPI REST + WebSocket
│   ├── BackgroundTasks (in-process)
│   └── asyncio.Semaphore(20)
│
├── MongoDB Atlas M10 (Mumbai)
│   ├── webhook_events (audit log)
│   ├── tips (with unique index)
│   └── creators (with atomic $inc)
│
└── Cashfree Sandbox → Production
    ├── PG (collect)
    ├── EasySplit (split)
    └── Payouts (withdraw)
```

**Why this works at MVP scale:**
- `BackgroundTasks` + `Semaphore(20)` handles ~10 concurrent tips/sec
- Single MongoDB connection pool with Motor's async driver
- WebSocket connections for overlays (typically 1 per active creator)
- Heroku Standard-2X provides 1GB RAM, sufficient for 50 concurrent streams

**Estimated capacity:** At 50 concurrent creators with an average of 2 tips/minute each, that's ~1.7 tips/sec globally — well within a single-dyno capacity.

#### Phase 2 — Growth (50–500 Creators)

**Key upgrades:**
1. **ARQ task queue** (Redis-backed) replaces `BackgroundTasks` for durable webhook processing
2. **Separate worker process** for tip processing (independent scaling)
3. **Redis** for WebSocket pub/sub (multi-worker fan-out)
4. **MongoDB Atlas M30** with read replicas for dashboard queries

```
┌──────────────────────┐     ┌──────────────────────┐
│  API Server (x2)     │     │  Worker Process (x2) │
│  ├── REST endpoints  │     │  ├── ARQ consumer    │
│  ├── Webhook ingest  │────▶│  ├── Tip processor   │
│  └── WebSocket mgr   │     │  └── Payout handler  │
└──────────┬───────────┘     └──────────────────────┘
           │
    ┌──────▼──────┐
    │   Redis     │ (job queue + WS pub/sub)
    └─────────────┘
```

#### Phase 3 — Scale (500+ Creators, Viral Events)

**Key upgrades:**
1. **Redis Streams** or **Kafka** as the event backbone
2. **MongoDB sharding** by `creator_id` for write-heavy tip inserts
3. **Kubernetes** horizontal pod autoscaler on webhook consumer pods
4. **CDN-backed** static overlay page (no React, pure HTML/CSS/JS)
5. **Cashfree Batch Transfers** (up to 5,000/batch) for scheduled payouts

---

### 2.4 Cashfree Integration — Step-by-Step Remaining Work

#### Step 1: Enable EasySplit on Cashfree Dashboard

> [!CAUTION]
> This is a **blocking prerequisite** — cannot be done via API. Must contact Cashfree account manager or fill out the activation form. Allow 2–5 business days.

- [ ] Create Cashfree PG account (if not done)
- [ ] Request EasySplit activation for both Sandbox and Production
- [ ] Configure webhook URL: `https://<your-domain>/api/webhooks/cashfree`
- [ ] Note down Production `client_id` and `client_secret`

#### Step 2: Integrate Cashfree JS Checkout SDK in Frontend

The current `TipPage.tsx` handles form submission but never renders the actual Cashfree payment sheet. The fix:

```typescript
// frontend/src/features/tip/tip.service.ts — Updated flow
import { load } from "@cashfreepayments/cashfree-js";

export async function initiateCashfreePayment(
  paymentSessionId: string, 
  orderId: string
) {
  const cashfree = await load({ mode: "sandbox" }); // or "production"
  
  const checkoutOptions = {
    paymentSessionId,
    redirectTarget: "_modal", // Opens UPI sheet as modal
  };
  
  const result = await cashfree.checkout(checkoutOptions);
  
  if (result.error) {
    throw new Error(result.error.message);
  }
  
  // Payment completed — webhook will handle the rest server-side
  return result;
}
```

**npm package:** `npm install @cashfreepayments/cashfree-js`

#### Step 3: Creator Vendor Onboarding Flow

New UI flow after Google sign-in:

```
Google Sign-In
    │
    ▼
┌─────────────────────┐
│  Step 1: Enter UPI   │  (e.g., creator@okaxis)
│  [Verify via API]     │  → Cashfree penny-drop validation
└──────────┬────────────┘
           │
           ▼
┌─────────────────────┐
│  Step 2: KYC Details  │  PAN Number + Address Proof
│  [Submit via API]     │  → create_vendor() call
└──────────┬────────────┘
           │
           ▼
┌─────────────────────┐
│  Step 3: Go Live!     │  Dashboard unlocked
│  Share your tip link  │  OBS overlay ready
└───────────────────────┘
```

**Backend endpoint needed:**

```python
# POST /api/creators/onboard
async def onboard_creator(
    upi_id: str,
    pan_number: str,
    address_proof_type: str,  # aadhaar | passport | voter_id
):
    # 1. Call cashfree_client.create_vendor(...)
    # 2. Update creator.cashfree_vendor_id
    # 3. Update creator.upi_id + upi_verified
```

#### Step 4: Payout Webhook Handler

Add a handler for Cashfree Payouts callbacks:

```python
# In webhooks/service.py — extend handle_cashfree_webhook()
if event_type in ("payout.processed", "TRANSFER_SUCCESS"):
    # Update withdrawal status to SUCCESS
    ...
elif event_type in ("payout.failed", "TRANSFER_FAILED"):
    # Revert creator wallet balance
    # Update withdrawal status to FAILED
    ...
```

---

### 2.5 Money Flow — Complete End-to-End Sequence

```
Viewer                  Frontend              Backend             Cashfree           Creator
  │                        │                     │                   │                  │
  │─── Opens tip link ────▶│                     │                   │                  │
  │                        │── POST /create-order─▶│                  │                  │
  │                        │                     │── Create Order ──▶│                  │
  │                        │                     │  (with splits)    │                  │
  │                        │◀─ paymentSessionId ─│◀─── order_id ────│                  │
  │                        │                     │                   │                  │
  │◀── Cashfree UPI Sheet ─│                     │                   │                  │
  │─── Pays via GPay/PhonePe ──────────────────────────────────────▶│                  │
  │                        │                     │                   │                  │
  │                        │                     │◀── Webhook ──────│                  │
  │                        │                     │  payment.captured  │                  │
  │                        │                     │                   │── Split ────────▶│
  │                        │                     │                   │  90% → Vault     │
  │                        │                     │                   │  10% → Sponza    │
  │                        │                     │                   │                  │
  │                        │                     │── Insert Tip ──▶DB                  │
  │                        │                     │── $inc wallet ─▶DB                  │
  │                        │                     │── WS broadcast ─▶│                  │
  │                        │                     │                   │    ┌──────────┐  │
  │                        │                     │                   │    │ OBS Alert │  │
  │                        │                     │                   │    │ Dashboard │  │
  │                        │                     │                   │    └──────────┘  │
  │                        │                     │                   │                  │
  │                        │                     │  (Creator clicks  │                  │
  │                        │                     │   Withdraw ₹500)  │                  │
  │                        │                     │── Payout API ───▶│                  │
  │                        │                     │                   │── UPI Transfer ─▶│
  │                        │                     │◀── payout.done ──│                  │
  │                        │                     │── Update status ▶DB                  │
```

---

### 2.6 Concurrency & Idempotency Design

#### Problem: 1,000 viewers tip the same creator in 60 seconds during a viral moment.

**Our defense layers:**

| Layer | Mechanism | What It Prevents |
| :--- | :--- | :--- |
| **L1 — Webhook dedup** | `WebhookEvent.cashfree_payment_id` unique lookup before insert | Cashfree retry floods |
| **L2 — Tip dedup** | `Tip.cashfree_payment_id` unique MongoDB index | Double-crediting wallet |
| **L3 — Atomic wallet** | `$inc` operator on `creator.wallet_balance` | Race conditions between concurrent tip processors |
| **L4 — Bounded concurrency** | `asyncio.Semaphore(20)` on processor | MongoDB connection pool exhaustion |
| **L5 — Background isolation** | `BackgroundTasks` (MVP) → ARQ (Growth) | Webhook timeout (Cashfree expects 200 in <5s) |

#### Why `$inc` instead of read-modify-write:

```python
# ❌ WRONG — Race condition under concurrency
creator = await Creator.get(creator_id)
creator.wallet_balance += tip_amount  # Another request could read stale value
await creator.save()

# ✅ CORRECT — Atomic increment, no read-modify-write
await Creator.get_motor_collection().update_one(
    {"_id": creator_id},
    {"$inc": {"wallet_balance": Decimal128(str(tip_amount))}}
)
```

---

### 2.7 Deployment Strategy (Heroku)

```
sponza-monorepo/
├── backend/
│   ├── Procfile          # web: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
│   ├── Dockerfile        # For container-based deployment
│   └── requirements.txt
├── frontend/
│   ├── Dockerfile        # Build → serve via nginx
│   └── package.json
└── Procfile              # Root Procfile for monorepo deployment
```

**Heroku considerations:**
- Standard-2X dyno (1GB RAM) for backend
- Frontend deployed as static build to Vercel/Netlify (recommended over Heroku for frontend)
- **WebSocket support**: Heroku supports WebSockets natively on `wss://` with a 55-second timeout; implement ping/pong keepalive every 30 seconds
- **Worker dyno**: Separate `worker` process type for ARQ when graduating from BackgroundTasks

---

### 2.8 Implementation Priority Queue

> [!IMPORTANT]
> Ordered by business criticality — what blocks us from processing the first real rupee.

| Priority | Task | Effort | Blocker? |
| :--- | :--- | :--- | :---: |
| **P0** | Request EasySplit activation from Cashfree | 1 hour + wait | Yes (2-5 days) |
| **P0** | Integrate Cashfree JS Checkout SDK in `TipPage.tsx` | 4 hours | Yes |
| **P0** | E2E sandbox test: create order → pay → webhook → tip in DB | 4 hours | Yes |
| **P1** | Creator onboarding flow (UPI verify + KYC submission) | 8 hours | Yes (for real creators) |
| **P1** | Payout webhook handler (success/failure status update) | 3 hours | Yes (for withdrawals) |
| **P1** | Deploy backend to Heroku, frontend to Vercel | 4 hours | Yes (for public access) |
| **P2** | MongoDB Atlas M10 cluster setup (Mumbai region) | 2 hours | No |
| **P2** | Production Cashfree keys + webhook URL configuration | 1 hour | No |
| **P3** | ARQ task queue migration (replace BackgroundTasks) | 6 hours | No |
| **P3** | Redis pub/sub for multi-worker WebSocket fan-out | 4 hours | No |
| **P3** | Monitoring: Prometheus metrics + Grafana dashboards | 4 hours | No |

---

## Summary

**Sponza's codebase is architecturally complete** — all models, routes, services, security layers, and UI components are built and wired. The remaining work is **integration testing** against the live Cashfree sandbox and **productionizing** the deployment pipeline. The critical path is:

1. **Activate EasySplit** on Cashfree (external dependency, start immediately)
2. **Wire the Cashfree JS SDK** into the tip payment flow
3. **Run the first sandbox E2E test** (order → payment → webhook → wallet update → overlay alert)
4. **Deploy to Heroku + Vercel** and onboard the first creator

Once the MVP handles 50 creators reliably, the scaling path is clear: swap BackgroundTasks for ARQ, add Redis for pub/sub, and shard MongoDB by `creator_id`.
