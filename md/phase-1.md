# Phase 1 — Atlas Account, Cluster & Network Setup

> **Goal:** A running MongoDB Atlas cluster with proper billing, network rules, and a database user — ready to accept connections from your API.

---

## Prerequisites (before touching Atlas)

| # | Action | Details |
|---|--------|---------|
| 0.1 | **Decide where the API will run** | Atlas is **never** called directly from the browser. You need a server: Railway, Render, Fly.io, or Vercel Serverless + small Node API. Pick one before proceeding. |
| 0.2 | **Create a MongoDB Atlas account** | Go to [cloud.mongodb.com](https://cloud.mongodb.com) → sign in with Google or GitHub. |
| 0.3 | **Keep $500 credits strategy in mind** | M0 (free) for local dev experiments. M10 (paid) for production-like testing and webhooks. One M10 cluster ≈ ~$57/month → **~8–9 months on $500**. |

---

## Step 1 — Organization & Project

### 1.1 Create Organization

1. Atlas dashboard → top-left dropdown → **Create Organization**
2. Name: `Sponsa`
3. Cloud service: **MongoDB Atlas**
4. Click **Create Organization**

> This is your billing and team-access boundary. All projects and clusters live under it.

### 1.2 Create Project

1. Inside the `Sponsa` org → **New Project**
2. Name: `sponsa-production`
3. Skip adding members for now (you're the only one)
4. Click **Create Project**

> One cluster per project is the typical pattern. You can add `sponsa-staging` later if needed.

### 1.3 Apply $500 Credits

1. Go to **Organization → Billing → Credits / Promotions**
2. If credits were applied via a promo code, enter it here
3. Verify the credit balance shows **$500.00**
4. If credits came with your Atlas account (e.g., startup program), they may already be applied — just verify

### 1.4 Set Billing Alerts

1. **Billing → Alerts**
2. Create alerts at:
   - **50% credits used** ($250 remaining)
   - **80% credits used** ($100 remaining)
   - **90% credits used** ($50 remaining)
3. Send to your email

> This prevents surprise charges once credits expire.

---

## Step 2 — Cluster Creation

### 2.1 Deploy Cluster

1. **Database** (left nav) → **Build a Database**
2. Choose deployment type:

| Environment | Recommended Tier | Cost | When to use |
|-------------|-----------------|------|-------------|
| Local dev / experiments | **M0 (Free)** | $0 | Just prototyping, no webhooks |
| Waitlist MVP | **M0 (Free)** | $0 | Enough for < 500 waitlist entries |
| Production (webhooks + payments) | **M10 Dedicated** | ~$57/month | When Razorpay webhooks go live |

### 2.2 Configuration (M10 recommended for production path)

| Setting | Value | Why |
|---------|-------|-----|
| **Cloud Provider** | AWS | Best Atlas integration |
| **Region** | `ap-south-1` (Mumbai) | Lowest latency for Indian users |
| **Cluster Tier** | M10 (or M0 for dev) | M10 = dedicated resources, backups, VPC peering |
| **Cluster Name** | `sponsa-prod` | Clear naming (create `sponsa-dev` separately if needed) |
| **MongoDB Version** | 7.0 | Current stable |
| **Replication** | 3-node replica set | Default on M10, included in price |
| **Backup** | Cloud Backup (enabled by default on M10) | Continuous snapshots |

3. Click **Create Deployment**
4. Wait 5–15 minutes for status → **Available** ✅

### 2.3 Credits Math

```
M0 free cluster:  $0/month   → unlimited on credits
M10 Mumbai:       ~$57/month → $500 ÷ $57 ≈ 8.7 months
M10 + M0 combo:   ~$57/month → same (M0 is free)
```

> **Recommendation:** Use one M10 cluster with two database names (`sponsa_dev` and `sponsa`) on it. This saves credits vs. running two clusters.

---

## Step 3 — Network Security

### 3.1 Add IP Allowlist

1. **Network Access** (left nav) → **Add IP Address**

### 3.2 For Local Development

| Action | Value | Notes |
|--------|-------|-------|
| Add your current IP | Click **Add Current IP Address** | Atlas auto-detects it |
| Temporary open access | `0.0.0.0/0` (allow from anywhere) | ⚠️ Only while prototyping — **remove before launch** |

### 3.3 For Production API

| Hosting Provider | How to get egress IP |
|-----------------|---------------------|
| **Railway** | Settings → Networking → Static IP (paid add-on) |
| **Render** | Static outbound IPs listed in dashboard |
| **Fly.io** | `flyctl ips list` |
| **Vercel Serverless** | Dynamic IPs — use `0.0.0.0/0` + strong password, or use Vercel + Atlas integration |

> **Best practice:** Fixed server IP in allowlist > `0.0.0.0/0`. If you must use `0.0.0.0/0`, ensure your DB password is 20+ characters and rotated periodically.

### 3.4 Optional: Private Endpoint (Later)

- Available on M10+ clusters
- If your API runs in the same AWS region (Mumbai), you can set up VPC peering or a Private Endpoint for zero-public-internet traffic
- Not needed for MVP — do this when you have real payment data

---

## Step 4 — Database User & Connection String

### 4.1 Create Database User

1. **Database Access** → **Add New Database User**

| Setting | Value |
|---------|-------|
| **Auth method** | Password |
| **Username** | `sponsa_api` |
| **Password** | Auto-generate a strong password (20+ chars) → **copy it immediately** |
| **Privileges** | `readWrite` on database `sponsa` (use "Specific Privileges" for least-privilege) |

> For now, `Atlas Admin` works for dev. Lock down to `readWrite@sponsa` before production.

### 4.2 Get Connection String

1. **Database** → your cluster → **Connect**
2. Choose **Drivers** → **Node.js** → version **5.x or later**
3. Copy the connection URI:

```
mongodb+srv://sponsa_api:<password>@sponsa-prod.xxxxx.mongodb.net/sponsa?retryWrites=true&w=majority&appName=sponsa-prod
```

4. Replace `<password>` with the actual password you copied

### 4.3 Store the URI

| Environment | Where to store |
|-------------|---------------|
| Local dev | `.env.local` (must be in `.gitignore`) |
| Staging | Hosting provider env vars |
| Production | Hosting provider env vars **only** |

```env
# .env.local (NEVER commit this)
MONGODB_URI=mongodb+srv://sponsa_api:YOUR_PASSWORD@sponsa-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=sponsa_dev
```

> ⚠️ **Critical:** Never put `MONGODB_URI` in any `VITE_*` env var. Vite exposes `VITE_*` vars to the browser bundle. The URI must only exist on the server side.

---

## Verification Checklist

After completing Phase 1, confirm:

- [ ] Atlas account created and logged in
- [ ] Organization `Sponsa` exists
- [ ] Project `sponsa-production` exists
- [ ] Credits applied and billing alerts set
- [ ] Cluster `sponsa-prod` is in **Available** state
- [ ] Network access: your local IP added (or temporary `0.0.0.0/0`)
- [ ] Database user `sponsa_api` created with password saved
- [ ] Connection string copied and stored in `.env.local`
- [ ] `.env.local` is in `.gitignore`
- [ ] Test connection works:

```bash
# Quick test with mongosh (install: brew install mongosh / npm i -g mongosh)
mongosh "mongodb+srv://sponsa_api:<password>@sponsa-prod.xxxxx.mongodb.net/sponsa"

# Once connected, run:
db.runCommand({ ping: 1 })
# Expected: { ok: 1 }
```

---

## What's Next

→ **[Phase 2](./phase-2.md)** — Define collections, schemas, and indexes (starting with the waitlist collection).
