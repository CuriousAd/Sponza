# Phase 3 — Backend API Scaffold & Cashfree Client Setup

> **Goal:** A working FastAPI project structure with database connection, configuration settings, and a fully asynchronous Cashfree API wrapper using `httpx`.

---

## Project Structure

```
sponsa-tip-it-now/
├── server/
│   ├── main.py                 # FastAPI entry point & lifespan context
│   ├── db.py                   # Motor / Beanie initialization
│   ├── config.py               # Application settings (Pydantic Settings)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── creator.py
│   │   ├── tip.py
│   │   ├── withdrawal.py
│   │   ├── revenue.py
│   │   └── webhook_event.py
│   ├── routes/
│   │   ├── __init__.py
│   │   └── webhooks/
│   │       └── cashfree.py     # Inbound payment webhook handler
│   ├── services/
│   │   ├── __init__.py
│   │   └── cashfree.py         # Async Cashfree client
│   └── requirements.txt
├── package.json
└── ...
```

---

## Step 1 — Project Initialization & Requirements

Create the server directory and set up `server/requirements.txt`:

```txt
fastapi==0.115.*
gunicorn==22.*
uvicorn[standard]==0.34.*
uvloop==0.21.*
motor==3.7.*
beanie==1.27.*
pydantic[email]==2.*
pydantic-settings==2.*
python-dotenv==1.*
httpx==0.28.*
authlib==1.6.*
pyjwt==2.*
tenacity==9.*
slowapi==0.1.*
bleach==6.*
```

Install the packages:
```bash
cd server
pip install -r requirements.txt
```

---

## Step 2 — Configuration Settings

Set up `server/config.py` using `pydantic-settings` to parse configuration variables from `.env`:

```python
# server/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # MongoDB
    mongodb_uri: str
    mongodb_db_name: str = "sponsa_dev"

    # Server
    port: int = 8000
    frontend_url: str = "http://localhost:5173"
    jwt_secret: str
    jwt_algorithm: str = "HS256"

    # Google OAuth
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str = "http://localhost:8000/api/auth/callback"

    # Cashfree PG
    cashfree_client_id: str
    cashfree_client_secret: str
    cashfree_webhook_secret: str
    cashfree_api_version: str = "2025-01-01"
    cashfree_base_url: str = "https://sandbox.cashfree.com/pg"

    # Cashfree Payouts
    cashfree_payout_client_id: str = ""
    cashfree_payout_client_secret: str = ""
    cashfree_payout_base_url: str = "https://payout-gamma.cashfree.com/payout"

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## Step 3 — Database Connection

Initialize the connection using Motor and Beanie ODM:

```python
# server/db.py
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from config import settings

from models.creator import Creator
from models.tip import Tip
from models.withdrawal import Withdrawal
from models.revenue import SponSaRevenue
from models.webhook_event import WebhookEvent

async def connect_db():
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]

    await init_beanie(
        database=db,
        document_models=[
            Creator,
            Tip,
            Withdrawal,
            SponSaRevenue,
            WebhookEvent,
        ],
    )
    print(f"✅ Connected to MongoDB: {settings.mongodb_db_name}")
    return client
```

---

## Step 4 — Asynchronous Cashfree API Client Wrapper

Create a client utilizing `httpx` to communicate asynchronously with Cashfree's endpoint, avoiding event-loop blocking:

```python
# server/services/cashfree.py
import httpx
from config import settings

class CashfreeClient:
    def __init__(self):
        self.headers = {
            "x-client-id": settings.cashfree_client_id,
            "x-client-secret": settings.cashfree_client_secret,
            "x-api-version": settings.cashfree_api_version,
            "Content-Type": "application/json",
        }
        self.payout_headers = {
            "x-client-id": settings.cashfree_payout_client_id or settings.cashfree_client_id,
            "x-client-secret": settings.cashfree_payout_client_secret or settings.cashfree_client_secret,
            "Content-Type": "application/json",
        }
        self.base_url = settings.cashfree_base_url
        self.payout_url = settings.cashfree_payout_base_url

    async def create_order(self, order_id: str, amount: float, customer_name: str, vendor_id: str, split_pct: float = 90.0):
        """Create a payment session order with static EasySplit split mapping."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            payload = {
                "order_id": order_id,
                "order_amount": amount,
                "order_currency": "INR",
                "customer_details": {
                    "customer_id": f"cust_{order_id}",
                    "customer_name": customer_name,
                    "customer_phone": "9999999999" # Placeholder required parameter
                },
                "order_splits": [
                    {
                        "vendor_id": vendor_id,
                        "percentage": split_pct
                    }
                ]
            }
            resp = await client.post(
                f"{self.base_url}/orders",
                json=payload,
                headers=self.headers
            )
            resp.raise_for_status()
            return resp.json()

    async def create_vendor(self, vendor_id: str, name: str, email: str, upi_vpa: str, kyc_details: dict):
        """Onboard a new creator as a Cashfree EasySplit vendor."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            payload = {
                "vendor_id": vendor_id,
                "name": name,
                "email": email,
                "phone": kyc_details.get("phone", "9999999999"),
                "upi": upi_vpa,
                "kyc_details": kyc_details
            }
            resp = await client.post(
                f"{self.base_url}/easy-split/vendors",
                json=payload,
                headers=self.headers
            )
            resp.raise_for_status()
            return resp.json()

    async def initiate_payout(self, vendor_id: str, amount: float, upi_vpa: str, transfer_id: str):
        """Send funds instantly from vendor's Virtual Vault to their UPI address."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            payload = {
                "beneId": vendor_id,
                "amount": amount,
                "transferId": transfer_id,
                "transferMode": "upi",
                "beneDetails": {
                    "vpa": upi_vpa
                }
            }
            resp = await client.post(
                f"{self.payout_url}/v1/directTransfer",
                json=payload,
                headers=self.payout_headers
            )
            resp.raise_for_status()
            return resp.json()

cashfree_client = CashfreeClient()
```

---

## Step 5 — FastAPI Entry Point

Define the root app server utilizing FastAPI lifespan contexts:

```python
# server/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from db import connect_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect database
    client = await connect_db()
    yield
    # Cleanup database connection
    client.close()

app = FastAPI(
    title="Sponsa API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

## Verification Checklist

- [ ] Requirements.txt contains async packages (`httpx`, `uvloop`)
- [ ] Connection wrapper successfully connects to MongoDB
- [ ] Configuration parameters parsed successfully from `.env`
- [ ] `CashfreeClient.create_order` endpoint returns a sandbox payment session successfully
- [ ] `/health` returns `{ "status": "ok" }`

---

## What's Next

→ **[Phase 4](./phase-4.md)** — Google OAuth authentication and direct onboard creation.
