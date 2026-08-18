# 🚀 Sponza - Production Monorepo

Sponza is a high-volume real-time UPI tipping and revenue-share payment platform engineered for Indian content creators.

---

## 🏗️ Architecture Overview

The repository is structured as a decoupled monorepo supporting independent deployment units for backend and frontend microservices.

```
sponza/
├── backend/                  # FastAPI Application (Vertical Slice Architecture)
│   ├── app/
│   │   ├── main.py           # Application Entry Point & Lifespan Handler
│   │   ├── config.py         # Pydantic Settings Configuration
│   │   ├── database.py       # MongoDB & Beanie ODM Initialization
│   │   ├── core/             # Cross-cutting Security, Middleware & Auth
│   │   ├── integrations/     # Cashfree PG, EasySplit & Payout API Integration
│   │   └── modules/          # Feature Domains (Vertical Slices)
│   │       ├── auth/         # Google OAuth2 Authentication
│   │       ├── creators/     # Profile & Vendor Management
│   │       ├── payments/     # Tip Order Creation & Async Processing
│   │       ├── webhooks/     # Idempotent Inbound Payment Webhooks
│   │       ├── wallet/       # Ledger Balance & UPI Instant Payouts
│   │       └── overlay/      # Real-Time WebSocket Streaming Overlay
│   ├── Dockerfile
│   ├── Procfile              # Heroku Deployment Config
│   └── requirements.txt
│
├── frontend/                 # React 18 + Vite + Tailwind CSS + Shadcn UI
│   ├── src/
│   │   ├── app/              # Router & App Providers
│   │   ├── features/         # Feature Modules (auth, dashboard, tip, overlay, landing)
│   │   ├── components/ui/    # Atomic Shadcn Primitives
│   │   ├── hooks/            # Shared React Hooks
│   │   └── lib/              # API Client & Utility Functions
│   ├── Dockerfile
│   └── package.json
│
├── docs/                     # PRD, Architecture Specs & Cashfree Guides
├── docker-compose.yml        # Full-Stack Local Environment (MongoDB + Backend + Frontend)
├── dev.ps1                   # Local Development Launch Script
└── Procfile                  # Monorepo Heroku Web Procfile
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker Desktop (Optional for local MongoDB)

### Option A: Local Native Development
1. **Copy environment variables**:
   ```bash
   cp .env.example backend/.env
   ```
2. **Start Dev Servers (PowerShell)**:
   ```powershell
   npm run dev
   ```
   *or manually:*
   ```powershell
   # Terminal 1 (Backend)
   cd backend
   python -m uvicorn app.main:app --reload --port 8000

   # Terminal 2 (Frontend)
   cd frontend
   npm run dev
   ```

3. **Access Services**:
   - **Frontend App**: `http://localhost:8080`
   - **FastAPI Docs**: `http://localhost:8000/docs`
   - **Health Endpoint**: `http://localhost:8000/health`

### Option B: Docker Compose
```bash
npm run docker:up
```

---

## ☁️ Deployment (Heroku)

### Deploying Backend to Heroku
1. **Create Heroku App**:
   ```bash
   heroku create sponza-backend-api
   ```
2. **Set Buildpack & Environment Variables**:
   ```bash
   heroku buildpacks:set heroku/python -a sponza-backend-api
   heroku config:set MONGODB_URI="your_mongodb_atlas_uri" -a sponza-backend-api
   heroku config:set JWT_SECRET="your_jwt_secret" -a sponza-backend-api
   ```
3. **Deploy from Subdirectory**:
   ```bash
   git subtree push --prefix backend heroku main
   ```

---

## 🔒 Key Design Patterns & Security
- **Vertical Slicing**: Grouping by domain features (`creators`, `payments`, `wallet`, `overlay`) instead of technical layers (`routers`, `services`).
- **Idempotency**: Webhook events and payment IDs are tracked with MongoDB unique indexes to prevent double-crediting.
- **Concurrency Control**: Async Python semaphores cap concurrent webhook ingestion to preserve system stability under high traffic.
- **WebSocket Overlay**: OBS browser sources stream live tip alerts in real time without polling.
