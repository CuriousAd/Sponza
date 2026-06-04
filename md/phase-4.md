# Phase 4 — Clerk Authentication & Creator Onboarding

> **Goal:** Approved waitlist creators can sign up via Clerk, get a `creators` document in MongoDB, and access their dashboard.

---

## Overview: The Approval → Onboarding Pipeline

```
Waitlist signup (Phase 3)
  → Admin reviews in Atlas/Compass
  → Admin sets status: "approved"
  → Admin sends Clerk invitation (API or dashboard)
  → Creator clicks invite → signs up on Clerk
  → Clerk fires user.created webhook → backend creates creators doc
  → Creator logged in → redirected to dashboard
```

---

## Step 1 — Set Up Clerk

### 1.1 Create Clerk Application

1. Go to [clerk.com](https://clerk.com) → Create account → **Add Application**
2. App name: `Sponsa`
3. Choose auth methods: **Email + Google OAuth**
4. Framework: **React (Vite)**

### 1.2 Get API Keys

From Clerk Dashboard → **API Keys**:

| Key | Where to store |
|-----|---------------|
| `CLERK_PUBLISHABLE_KEY` | Vite `.env` as `VITE_CLERK_PUBLISHABLE_KEY` (safe for frontend) |
| `CLERK_SECRET_KEY` | Server `.env.local` only (never in frontend) |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Server `.env.local` (for webhook verification) |

### 1.3 Install Clerk in Frontend

```bash
# In project root (Vite app)
npm install @clerk/clerk-react
```

### 1.4 Install Clerk Backend SDK

```bash
# In server/
npm install @clerk/clerk-sdk-node svix
```

> `svix` is used to verify Clerk webhook signatures.

---

## Step 2 — Frontend Clerk Integration

### 2.1 Wrap App with ClerkProvider

```jsx
// src/main.jsx
import { ClerkProvider } from "@clerk/clerk-react";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById("root")).render(
  <ClerkProvider publishableKey={CLERK_KEY}>
    <App />
  </ClerkProvider>
);
```

### 2.2 Protect Dashboard Routes

```jsx
// src/App.jsx (simplified)
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/waitlist" element={<WaitlistPage />} />
      <Route path="/:slug" element={<TippingPage />} />

      {/* Protected routes */}
      <Route path="/dashboard/*" element={
        <>
          <SignedIn><Dashboard /></SignedIn>
          <SignedOut><RedirectToSignIn /></SignedOut>
        </>
      } />
    </Routes>
  );
}
```

---

## Step 3 — Creator Model (Mongoose)

```js
// server/models/Creator.js
import mongoose from "mongoose";

const creatorSchema = new mongoose.Schema({
  clerkUserId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  slug: {
    type: String, required: true, unique: true,
    lowercase: true, trim: true,
    match: /^[a-z0-9_-]{3,30}$/,
  },
  displayName: { type: String, required: true, trim: true },
  avatarUrl: { type: String, default: null },
  youtubeUrl: { type: String, default: null },
  upiId: { type: String, default: null },
  walletBalance: {
    type: mongoose.Schema.Types.Decimal128,
    default: 0,
    get: (v) => parseFloat(v?.toString() || "0"),
  },
  approved: { type: Boolean, default: true },
  onboardedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  toJSON: { getters: true },
});

export const Creator = mongoose.model("Creator", creatorSchema);
```

---

## Step 4 — Clerk Webhook: `user.created`

When a creator signs up via Clerk, Clerk fires a `user.created` webhook. Your backend uses this to create the `creators` doc.

### 4.1 Configure Webhook in Clerk Dashboard

1. Clerk Dashboard → **Webhooks** → **Add Endpoint**
2. URL: `https://your-api.com/api/webhooks/clerk`
3. Events: `user.created`, `user.updated`, `user.deleted`
4. Copy the **Signing Secret** → store as `CLERK_WEBHOOK_SIGNING_SECRET`

### 4.2 Webhook Route

```js
// server/routes/clerkWebhook.js
import { Router } from "express";
import { Webhook } from "svix";
import { Waitlist } from "../models/Waitlist.js";
import { Creator } from "../models/Creator.js";

const router = Router();

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  // Verify signature
  const wh = new Webhook(secret);
  let event;
  try {
    event = wh.verify(req.body, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });
  } catch (err) {
    console.error("Webhook verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Handle user.created
  if (event.type === "user.created") {
    const { id: clerkUserId, email_addresses, first_name, last_name, image_url } = event.data;
    const email = email_addresses[0]?.email_address;

    // Find their waitlist entry
    const waitlistEntry = await Waitlist.findOne({ email, status: "approved" });
    if (!waitlistEntry) {
      console.warn(`User ${email} signed up but not on approved waitlist`);
      return res.status(200).json({ message: "Ignored — not approved" });
    }

    // Generate slug from name
    const baseName = (first_name || waitlistEntry.name || "creator").toLowerCase();
    let slug = baseName.replace(/[^a-z0-9_-]/g, "");

    // Handle slug collisions
    let slugExists = await Creator.findOne({ slug });
    let attempt = 1;
    while (slugExists) {
      slug = `${baseName}${attempt}`;
      slugExists = await Creator.findOne({ slug });
      attempt++;
    }

    // Create creator doc
    await Creator.create({
      clerkUserId,
      email,
      slug,
      displayName: `${first_name || ""} ${last_name || ""}`.trim() || waitlistEntry.name,
      avatarUrl: image_url,
      youtubeUrl: waitlistEntry.youtubeUrl,
    });

    // Update waitlist entry
    await Waitlist.findByIdAndUpdate(waitlistEntry._id, { clerkUserId });

    console.log(`✅ Creator created: ${slug} (${email})`);
  }

  return res.status(200).json({ received: true });
});

export default router;
```

### 4.3 Register the Route

```js
// server/index.js — add before other routes
import clerkWebhookRoutes from "./routes/clerkWebhook.js";

// ⚠️ Clerk webhook needs raw body — register BEFORE express.json()
app.use("/api/webhooks/clerk", clerkWebhookRoutes);

// Then your other middleware
app.use(express.json({ limit: "10kb" }));
```

---

## Step 5 — Admin Approval Flow (Manual for MVP)

Until you build an admin UI, approve creators manually:

### Option A: MongoDB Compass / Atlas Data Explorer

1. Open `waitlist` collection
2. Find the entry → Edit → Set `status: "approved"`, `approvedAt: new Date()`, `approvedBy: "you@email.com"`

### Option B: Admin API Endpoint (simple, password-protected)

```js
// server/routes/admin.js
import { Router } from "express";
import { Waitlist } from "../models/Waitlist.js";

const router = Router();

// Simple admin auth (replace with proper auth later)
function adminAuth(req, res, next) {
  const key = req.headers["x-admin-key"];
  if (key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// GET /api/admin/waitlist — list pending
router.get("/waitlist", adminAuth, async (req, res) => {
  const entries = await Waitlist.find({ status: "pending" }).sort({ createdAt: -1 });
  res.json(entries);
});

// POST /api/admin/waitlist/:id/approve
router.post("/waitlist/:id/approve", adminAuth, async (req, res) => {
  const entry = await Waitlist.findByIdAndUpdate(req.params.id, {
    status: "approved",
    approvedAt: new Date(),
    approvedBy: "admin",
  }, { new: true });

  if (!entry) return res.status(404).json({ error: "Not found" });
  res.json({ message: "Approved", entry });
});

export default router;
```

---

## Step 6 — Dashboard API (Creator Data)

```js
// server/routes/creator.js
import { Router } from "express";
import { requireAuth } from "@clerk/clerk-sdk-node";
import { Creator } from "../models/Creator.js";

const router = Router();

// GET /api/creator/me — get logged-in creator's data
router.get("/me", requireAuth(), async (req, res) => {
  const creator = await Creator.findOne({ clerkUserId: req.auth.userId });
  if (!creator) return res.status(404).json({ error: "Creator not found" });
  res.json(creator);
});

// PATCH /api/creator/me — update profile
router.patch("/me", requireAuth(), async (req, res) => {
  const { displayName, upiId, avatarUrl } = req.body;
  const creator = await Creator.findOneAndUpdate(
    { clerkUserId: req.auth.userId },
    { displayName, upiId, avatarUrl, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!creator) return res.status(404).json({ error: "Creator not found" });
  res.json(creator);
});

export default router;
```

---

## Environment Variables (Updated)

```env
# server/.env.local
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=sponsa_dev
PORT=3001
FRONTEND_URL=http://localhost:5173
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
ADMIN_API_KEY=your-random-secret-key
```

```env
# Vite .env (frontend)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3001
```

---

## Verification Checklist

- [ ] Clerk app created with Email + Google auth
- [ ] Frontend wrapped in `ClerkProvider` — sign-in UI appears
- [ ] Dashboard routes protected with `SignedIn`
- [ ] Clerk webhook endpoint receives `user.created` events
- [ ] Webhook creates `creators` doc with unique slug
- [ ] `waitlist.clerkUserId` updated after signup
- [ ] `GET /api/creator/me` returns creator data for logged-in user
- [ ] Admin can approve waitlist entries (Compass or API)

---

→ **[Phase 5](./phase-5.md)** — Razorpay payments: tip collection, wallet updates, and creator withdrawals.
