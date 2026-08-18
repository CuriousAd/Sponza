# Phase 6 — Security Hardening, Deployment & Monitoring

> **Goal:** Secure the application against injection and spam attacks, deploy using a production-ready multi-worker process manager, and configure database monitoring dashboards.

---

## 1. Security Hardening

### 1.1 Input Sanitization
Viewers can submit name and message strings. To prevent Cross-Site Scripting (XSS) on the streamer's dashboard, we must sanitize all viewer inputs using `bleach`.

```python
# server/lib/security.py
import bleach

def sanitize_text(text: str) -> str:
    """Strip all HTML tags and attributes from viewer inputs."""
    if not text:
        return ""
    # Strip HTML tags
    return bleach.clean(text, tags=[], attributes={}, strip=True)
```

Integrate this inside your schemas or in the order creation route:
```python
@router.post("/create-order")
async def create_tip_order(data: CreateTipOrder):
    sanitized_name = sanitize_text(data.donor_name)
    sanitized_message = sanitize_text(data.message) if data.message else None
    # Use sanitized inputs in order creation notes...
```

### 1.2 Profanity Filter
Streamers should not have highly offensive messages shown on their dashboard ledger.

```python
# server/lib/profanity.py
PROFANITY_WORDLIST = {"scam", "fraud", "abuse_word_1", "abuse_word_2"}  # Replace with actual list

def filter_profanity(text: str, replacement: str = "***") -> str:
    """Filter list of blacklisted words from user message."""
    if not text:
        return ""
    words = text.split()
    filtered_words = [
        replacement if word.lower() in PROFANITY_WORDLIST else word
        for word in words
    ]
    return " ".join(filtered_words)
```

---

## 2. API Rate Limiting

To prevent bots from spamming checkout orders, set up rate limits using `slowapi`.

```python
# server/main.py
from slowapi import Limiter, _rate_limit_exceeded_finder
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={"error": "Too many requests. Please try again later."}
    )
```

Apply limits on user-facing endpoints:
```python
# server/routes/tip.py
from main import app, limiter
from fastapi import Request

@router.post("/create-order")
@limiter.limit("20/minute")  # Max 20 tip sessions per minute per client IP
async def create_tip_order(data: CreateTipOrder, request: Request):
    ...
```

> [!WARNING]
> Do **not** apply rate limits on the `/api/webhooks/cashfree` endpoint. Cashfree needs to deliver webhooks instantly, and rate-limiting them will cause payment processing failures.

---

## 3. Production Deployment Config

For production servers (e.g., Railway, Render), do not run raw `uvicorn main:app --reload`. Instead, use **Gunicorn** to manage multiple processes.

### 3.1 Multi-Process Setup
Gunicorn manages a master process that forks multiple Uvicorn workers. This allows the FastAPI application to scale across CPU cores.

Create a `Procfile` in the project root:
```
web: gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
```
- `-w 4`: Runs 4 workers (ideal for standard shared web containers with 1–2 vCPUs).
- `-k uvicorn.workers.UvicornWorker`: Runs Uvicorn workers for ASGI support.

---

## 4. Production Monitoring (MongoDB Atlas)

Once you upgrade to the **M10 cluster** and real money is flowing, monitor the following metrics in your Atlas console:

| Metric | Target | Warning Threshold | Remediation |
|---|---|---|---|
| **CPU Usage** | < 50% | > 80% | Scale up cluster tier or check for missing indexes |
| **Memory (RAM) Usage** | < 70% | > 90% | Index size might be exceeding RAM; optimize schema |
| **WiredTiger Concurrent Read Tickets** | 128 | < 20 remaining | Check for long-running uncommitted transactions |
| **WiredTiger Concurrent Write Tickets** | 128 | < 20 remaining | Use `$inc` to reduce write locks; optimize hot-path operations |

---

## Verification Checklist

- [ ] Bleach successfully strips HTML tags (e.g., `<script>alert(1)</script>` turns into `alert(1)`)
- [ ] Rate limits trigger HTTP 429 when client makes >20 requests/min to order endpoints
- [ ] Webhook webhook endpoint is excluded from rate limiting rules
- [ ] Multi-worker server launches successfully on localhost:
  ```bash
  gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
  ```
- [ ] Atlas monitoring charts confirm connections are evenly distributed across workers
