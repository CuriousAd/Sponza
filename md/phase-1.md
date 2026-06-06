# Phase 1 — Atlas Account, Cluster & Network Setup

> **Goal:** A running MongoDB Atlas cluster with proper billing, network rules, and a database user — ready to accept connections from your FastAPI backend.

---

## Prerequisites (before touching Atlas)

| # | Action | Details |
|---|--------|---------|
| 0.1 | **Decide where the API will run** | Atlas is **never** called directly from the browser. You need a server: Railway, Render, Fly.io, or Vercel. Pick one before proceeding. |
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
3. Click **Create Project**

> One cluster per project is the typical pattern. You can add `sponsa-staging` later if needed.

### 1.3 Apply $500 Credits

1. Go to **Organization → Billing → Credits / Promotions**
2. Enter your promo code and verify the credit balance shows **$500.00**
3. If credits came with your Atlas account, verify they are active.

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
| Local dev / experiments | **M0 (Free)** | $0 | Just prototyping and local testing |
| Production (webhooks + payments) | **M10 Dedicated** | ~$57/month | When Cashfree webhooks go live |

### 2.2 Configuration

| Setting | Value | Why |
|---------|-------|-----|
| **Cloud Provider** | AWS | Best Atlas integration |
| **Region** | `ap-south-1` (Mumbai) | Lowest latency for Indian users |
| **Cluster Tier** | M10 (or M0 for dev) | Dedicated resources, backup snapshots, VPC peering |
| **Cluster Name** | `sponsa-prod` | Clear naming |
| **MongoDB Version** | 7.0 | Current stable |

3. Click **Create Deployment**
4. Wait 5–15 minutes for status to change to **Available** ✅

> **Recommendation:** Use one M10 cluster with two database names (`sponsa_dev` and `sponsa`) on it. This saves credits vs. running two separate clusters.

---

## Step 3 — Network Security

### 3.1 Add IP Allowlist

1. **Network Access** (left nav) → **Add IP Address**

### 3.2 For Local Development

* Click **Add Current IP Address** to authorize your local network.
* For temporary prototyping only, you can allow `0.0.0.0/0` (remove before launch).

### 3.3 For Production API

| Hosting Provider | How to get egress IP |
|-----------------|---------------------|
| **Railway** | Settings → Networking → Static IP (paid add-on) |
| **Render** | Static outbound IPs listed in dashboard |
| **Fly.io** | `flyctl ips list` |

---

## Step 4 — Database User & Connection String

### 4.1 Create Database User

1. **Database Access** → **Add New Database User**

| Setting | Value |
|---------|-------|
| **Auth method** | Password |
| **Username** | `sponsa_api` |
| **Password** | Auto-generate a strong password (20+ chars) → **copy it immediately** |
| **Privileges** | `readWrite` on database `sponsa` (or `sponsa_dev`) |

### 4.2 Get Connection String

1. **Database** → your cluster → **Connect**
2. Choose **Drivers** → **Python** → version **3.11 or later**
3. Copy the connection URI:
```
mongodb+srv://sponsa_api:<password>@sponsa-prod.xxxx.mongodb.net/sponsa?retryWrites=true&w=majority
```
4. Replace `<password>` with your database user password.

### 4.3 Store the URI

Store the URI as `MONGODB_URI` in your backend `.env` file. **Never** expose this connection string in the frontend Vite configuration or `VITE_*` variables.

---

## Verification Checklist

- [ ] Atlas account created and logged in
- [ ] Organization `Sponsa` and project `sponsa-production` created
- [ ] Cluster `sponsa-prod` is in **Available** state
- [ ] Network access: your current IP added
- [ ] Database user `sponsa_api` created with password saved
- [ ] Connection string copied and stored in `server/.env` (gitignored)

---

## What's Next

→ **[Phase 2](./phase-2.md)** — Define collections, schemas, and indexes (starting with the creators collection).
