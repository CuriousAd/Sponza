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
| `CLERK_SECRET_KEY` | Server `.env` only (never in frontend) |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Server `.env` (for webhook verification) |

### 1.3 Install Clerk in Frontend

```bash
# In project root (Vite app)
npm install @clerk/clerk-react
```

### 1.4 Install Clerk Backend SDK (Python)

```bash
# In server/
pip install clerk-backend-api svix
```

Add to `server/requirements.txt`:

```txt
clerk-backend-api==1.*
svix==1.*
```

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
// src/App.jsx
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

## Step 3 — Creator Model

```python
# server/models/creator.py
from datetime import datetime
from decimal import Decimal
from typing import Optional

from beanie import Document, Indexed
from pydantic import EmailStr, Field


class Creator(Document):
    clerk_user_id: Indexed(str, unique=True)
    email: Indexed(EmailStr, unique=True)
    slug: Indexed(str, unique=True)  # sponsa.in/{slug}
    display_name: str
    avatar_url: Optional[str] = None
    youtube_url: Optional[str] = None
    upi_id: Optional[str] = None
    wallet_balance: Decimal = Decimal("0.00")
    approved: bool = True
    onboarded_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "creators"
```

---

## Step 4 — Update Config

```python
# server/config.py — add Clerk settings
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_uri: str
    mongodb_db_name: str = "sponsa_dev"
    port: int = 8000
    frontend_url: str = "http://localhost:5173"

    # Clerk
    clerk_secret_key: str = ""
    clerk_webhook_signing_secret: str = ""

    # Admin
    admin_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
```

---

## Step 5 — Clerk Webhook: `user.created`

When a creator signs up via Clerk, Clerk fires a `user.created` webhook. Your backend uses this to create the `creators` doc.

### 5.1 Configure Webhook in Clerk Dashboard

1. Clerk Dashboard → **Webhooks** → **Add Endpoint**
2. URL: `https://your-api.com/api/webhooks/clerk`
3. Events: `user.created`, `user.updated`, `user.deleted`
4. Copy the **Signing Secret** → store as `CLERK_WEBHOOK_SIGNING_SECRET`

### 5.2 Webhook Route

```python
# server/routes/clerk_webhook.py
import re
from fastapi import APIRouter, Request, HTTPException

from svix.webhooks import Webhook, WebhookVerificationError

from config import settings
from models.waitlist import Waitlist, WaitlistStatus
from models.creator import Creator

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/clerk")
async def clerk_webhook(request: Request):
    """Handle Clerk webhook events."""
    # Step 1: Verify signature
    body = await request.body()
    headers = {
        "svix-id": request.headers.get("svix-id", ""),
        "svix-timestamp": request.headers.get("svix-timestamp", ""),
        "svix-signature": request.headers.get("svix-signature", ""),
    }

    try:
        wh = Webhook(settings.clerk_webhook_signing_secret)
        event = wh.verify(body, headers)
    except WebhookVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event.get("type")
    data = event.get("data", {})

    # Step 2: Handle user.created
    if event_type == "user.created":
        clerk_user_id = data["id"]
        email = data["email_addresses"][0]["email_address"]
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        image_url = data.get("image_url")

        # Find approved waitlist entry
        waitlist_entry = await Waitlist.find_one(
            Waitlist.email == email.lower(),
            Waitlist.status == WaitlistStatus.APPROVED,
        )
        if not waitlist_entry:
            return {"message": "Ignored — not on approved waitlist"}

        # Generate URL-safe slug
        base_name = (first_name or waitlist_entry.name or "creator").lower()
        slug = re.sub(r"[^a-z0-9_-]", "", base_name)

        # Handle slug collisions
        attempt = 1
        original_slug = slug
        while await Creator.find_one(Creator.slug == slug):
            slug = f"{original_slug}{attempt}"
            attempt += 1

        # Create creator doc
        creator = Creator(
            clerk_user_id=clerk_user_id,
            email=email,
            slug=slug,
            display_name=f"{first_name} {last_name}".strip() or waitlist_entry.name,
            avatar_url=image_url,
            youtube_url=waitlist_entry.youtube_url,
        )
        await creator.insert()

        # Update waitlist entry
        waitlist_entry.clerk_user_id = clerk_user_id
        await waitlist_entry.save()

        print(f"✅ Creator created: {slug} ({email})")

    return {"received": True}
```

### 5.3 Register the Route

```python
# server/main.py — add to imports and router registration
from routes.clerk_webhook import router as clerk_webhook_router

app.include_router(clerk_webhook_router)
```

---

## Step 6 — Admin Approval Flow (Manual for MVP)

### Option A: MongoDB Compass / Atlas Data Explorer

1. Open `waitlist` collection
2. Find the entry → Edit → Set `status: "approved"`, `approved_at: new Date()`

### Option B: Admin API Endpoint

```python
# server/routes/admin.py
from datetime import datetime
from fastapi import APIRouter, HTTPException, Header
from beanie import PydanticObjectId

from config import settings
from models.waitlist import Waitlist, WaitlistStatus

router = APIRouter(prefix="/api/admin", tags=["admin"])


async def verify_admin(x_admin_key: str = Header(...)):
    """Simple API key auth for admin endpoints."""
    if x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.get("/waitlist")
async def list_pending(x_admin_key: str = Header(...)):
    """List pending waitlist entries."""
    await verify_admin(x_admin_key)
    entries = await Waitlist.find(
        Waitlist.status == WaitlistStatus.PENDING
    ).sort(-Waitlist.created_at).to_list()
    return entries


@router.post("/waitlist/{entry_id}/approve")
async def approve_entry(entry_id: PydanticObjectId, x_admin_key: str = Header(...)):
    """Approve a waitlist entry."""
    await verify_admin(x_admin_key)
    entry = await Waitlist.get(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")

    entry.status = WaitlistStatus.APPROVED
    entry.approved_at = datetime.utcnow()
    entry.approved_by = "admin"
    await entry.save()
    return {"message": "Approved", "entry": entry}
```

Register in `main.py`:

```python
from routes.admin import router as admin_router
app.include_router(admin_router)
```

---

## Step 7 — Dashboard API (Creator Data)

```python
# server/routes/creator.py
from fastapi import APIRouter, HTTPException, Depends

from models.creator import Creator
from routes.auth import get_current_user_id

router = APIRouter(prefix="/api/creator", tags=["creator"])


@router.get("/me")
async def get_my_profile(clerk_user_id: str = Depends(get_current_user_id)):
    """Get logged-in creator's profile."""
    creator = await Creator.find_one(Creator.clerk_user_id == clerk_user_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    return creator


@router.patch("/me")
async def update_profile(
    updates: dict,
    clerk_user_id: str = Depends(get_current_user_id),
):
    """Update creator profile (display_name, upi_id, etc.)."""
    allowed = {"display_name", "upi_id", "avatar_url"}
    filtered = {k: v for k, v in updates.items() if k in allowed}

    creator = await Creator.find_one(Creator.clerk_user_id == clerk_user_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")

    for key, value in filtered.items():
        setattr(creator, key, value)
    await creator.save()
    return creator
```

### Auth Dependency (Clerk JWT verification)

```python
# server/routes/auth.py
from fastapi import HTTPException, Header
from clerk_backend_api import Clerk

from config import settings

clerk = Clerk(bearer_auth=settings.clerk_secret_key)


async def get_current_user_id(authorization: str = Header(...)) -> str:
    """Extract and verify Clerk user ID from JWT."""
    try:
        token = authorization.replace("Bearer ", "")
        # Verify the session token with Clerk
        session = clerk.sessions.verify_token(token)
        return session.user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
```

---

## Environment Variables (Updated)

```env
# server/.env
MONGODB_URI=mongodb+srv://mathelet:$sponsa$12@sponsa-prod.jarn7lk.mongodb.net/?appName=sponsa-prod
MONGODB_DB_NAME=sponsa_dev
PORT=8000
FRONTEND_URL=http://localhost:5173
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
ADMIN_API_KEY=your-random-secret-key
```

```env
# Vite .env (frontend)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8000
```

---

## Verification Checklist

- [ ] Clerk app created with Email + Google auth
- [ ] Frontend wrapped in `ClerkProvider` — sign-in UI appears
- [ ] Dashboard routes protected with `SignedIn`
- [ ] Clerk webhook endpoint receives `user.created` events
- [ ] Webhook creates `creators` doc with unique slug
- [ ] `waitlist.clerk_user_id` updated after signup
- [ ] `GET /api/creator/me` returns creator data for logged-in user
- [ ] Admin can approve waitlist entries (Compass or API)

---

→ **[Phase 5](./phase-5.md)** — Razorpay payments: tip collection, wallet updates, and creator withdrawals.
