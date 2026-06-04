# Phase 3 — Backend API Scaffold & Waitlist Endpoint

> **Goal:** A working FastAPI + Motor/Beanie backend with a `POST /api/waitlist` endpoint connected to your Atlas cluster.

---

## Project Structure

```
sponza-tip-it-now/
├── src/                        # Vite frontend (existing)
├── server/                     # NEW — FastAPI backend
│   ├── main.py                 # FastAPI entry point
│   ├── db.py                   # Motor/Beanie connection
│   ├── config.py               # Settings via pydantic-settings
│   ├── models/
│   │   ├── __init__.py
│   │   ├── waitlist.py         # Waitlist Beanie document
│   │   ├── creator.py          # Creator document
│   │   ├── tip.py              # Tip document
│   │   ├── withdrawal.py       # Withdrawal document
│   │   └── revenue.py          # SponSa revenue document
│   ├── routes/
│   │   ├── __init__.py
│   │   └── waitlist.py         # Waitlist API routes
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── waitlist.py         # Request/response Pydantic models
│   ├── requirements.txt
│   └── .env                    # Local env vars (gitignored)
├── package.json
└── ...
```

---

## Step 1 — Initialize the Server

```bash
# From project root
mkdir -p server/models server/routes server/schemas
touch server/models/__init__.py server/routes/__init__.py server/schemas/__init__.py
```

### Create `server/requirements.txt`

```txt
fastapi==0.115.*
uvicorn[standard]==0.34.*
motor==3.7.*
beanie==1.27.*
pydantic[email]==2.*
pydantic-settings==2.*
python-dotenv==1.*
```

### Install dependencies

```bash
cd server
pip install -r requirements.txt
```

---

## Step 2 — Configuration

```python
# server/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_uri: str
    mongodb_db_name: str = "sponsa_dev"
    port: int = 8000
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
```

---

## Step 3 — Database Connection

```python
# server/db.py
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from config import settings
from models.waitlist import Waitlist
from models.creator import Creator
from models.tip import Tip
from models.withdrawal import Withdrawal
from models.revenue import SponSaRevenue


async def connect_db():
    """Initialize Motor client and Beanie ODM."""
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]

    await init_beanie(
        database=db,
        document_models=[
            Waitlist,
            Creator,
            Tip,
            Withdrawal,
            SponSaRevenue,
        ],
    )
    print(f"✅ Connected to MongoDB: {settings.mongodb_db_name}")
    return client
```

---

## Step 4 — Waitlist Model

```python
# server/models/waitlist.py
from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document, Indexed
from pydantic import EmailStr, Field


class WaitlistStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Waitlist(Document):
    email: Indexed(EmailStr, unique=True)
    name: str = Field(max_length=100)
    youtube_url: str
    message: Optional[str] = Field(default=None, max_length=500)
    status: WaitlistStatus = WaitlistStatus.PENDING

    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None
    clerk_invitation_id: Optional[str] = None
    clerk_user_id: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "waitlist"
        indexes = [
            [("status", 1), ("created_at", -1)],
            [("created_at", -1)],
        ]
```

---

## Step 5 — Request/Response Schemas

```python
# server/schemas/waitlist.py
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, HttpUrl


class WaitlistCreateRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=100)
    youtube_url: HttpUrl
    message: Optional[str] = Field(default=None, max_length=500)


class WaitlistCreateResponse(BaseModel):
    message: str
    id: str


class WaitlistCheckResponse(BaseModel):
    exists: bool
    status: Optional[str] = None


class ErrorResponse(BaseModel):
    error: str
```

---

## Step 6 — Waitlist Routes

```python
# server/routes/waitlist.py
from fastapi import APIRouter, HTTPException, Query
from pymongo.errors import DuplicateKeyError

from models.waitlist import Waitlist
from schemas.waitlist import (
    WaitlistCreateRequest,
    WaitlistCreateResponse,
    WaitlistCheckResponse,
)

router = APIRouter(prefix="/api/waitlist", tags=["waitlist"])


@router.post("/", response_model=WaitlistCreateResponse, status_code=201)
async def join_waitlist(body: WaitlistCreateRequest):
    """Add a new creator to the waitlist."""
    try:
        entry = Waitlist(
            email=body.email,
            name=body.name,
            youtube_url=str(body.youtube_url),
            message=body.message,
        )
        await entry.insert()
        return WaitlistCreateResponse(
            message="You're on the waitlist!",
            id=str(entry.id),
        )
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="This email is already on the waitlist.",
        )


@router.get("/check", response_model=WaitlistCheckResponse)
async def check_waitlist(email: str = Query(..., description="Email to check")):
    """Check if an email is already on the waitlist."""
    entry = await Waitlist.find_one(Waitlist.email == email.lower())
    return WaitlistCheckResponse(
        exists=entry is not None,
        status=entry.status if entry else None,
    )
```

---

## Step 7 — FastAPI Entry Point

```python
# server/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db import connect_db
from routes.waitlist import router as waitlist_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect to MongoDB. Shutdown: cleanup."""
    client = await connect_db()
    yield
    client.close()


app = FastAPI(
    title="Sponsa API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(waitlist_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

## Step 8 — Environment File

```env
# server/.env
MONGODB_URI=mongodb+srv://mathelet:$sponsa$12@sponsa-prod.jarn7lk.mongodb.net/?appName=sponsa-prod
MONGODB_DB_NAME=sponsa_dev
PORT=8000
FRONTEND_URL=http://localhost:5173
```

> ⚠️ Add `.env` to your `.gitignore`. Never commit secrets.

### Create `server/.env.example` for reference

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=sponsa_dev
PORT=8000
FRONTEND_URL=http://localhost:5173
```

---

## Step 9 — Update .gitignore

Add to the project root `.gitignore`:

```
# Server env
server/.env
!server/.env.example
__pycache__/
*.pyc
```

---

## Step 10 — Run & Test

### Start the server

```bash
cd server
uvicorn main:app --reload --port 8000
```

### Test waitlist signup

```bash
curl -X POST http://localhost:8000/api/waitlist/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test Creator",
    "youtube_url": "https://youtube.com/@test",
    "message": "Excited to try Sponsa!"
  }'

# Expected: 201 { "message": "You're on the waitlist!", "id": "..." }
```

### Test duplicate

```bash
curl -X POST http://localhost:8000/api/waitlist/ \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com", "name": "Test", "youtube_url": "https://youtube.com/@test" }'

# Expected: 409 { "detail": "This email is already on the waitlist." }
```

### Interactive API docs

Open **http://localhost:8000/docs** — FastAPI auto-generates Swagger UI for all your endpoints.

---

## Step 11 — Verify in Atlas

1. Go to Atlas → **Browse Collections**
2. Database: `sponsa_dev` → Collection: `waitlist`
3. You should see your test document
4. Check **Indexes** tab — confirm `email_1` unique index exists

---

## Connecting Frontend (Vite) to Backend

```ts
// src/api/waitlist.ts
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function joinWaitlist({ email, name, youtubeUrl, message }: {
  email: string; name: string; youtubeUrl: string; message?: string;
}) {
  const res = await fetch(`${API_URL}/api/waitlist/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, youtube_url: youtubeUrl, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to join waitlist");
  return data;
}
```

Add to Vite's `.env`:

```env
VITE_API_URL=http://localhost:8000
```

---

## Verification Checklist

- [ ] `uvicorn main:app --reload` starts server on port 8000
- [ ] `POST /api/waitlist/` returns 201 with valid data
- [ ] Duplicate email returns 409
- [ ] Invalid data (missing name) returns 422 with Pydantic errors
- [ ] Document visible in Atlas Data Explorer
- [ ] `.env` is gitignored
- [ ] Frontend can call the API without CORS errors
- [ ] **http://localhost:8000/docs** shows Swagger UI

---

→ **[Phase 4](./phase-4.md)** — Clerk authentication, creator onboarding, and the admin approval flow.
