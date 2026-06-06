# Phase 4 — Google OAuth & Creator Onboarding

> **Goal:** Creators sign in directly using Google OAuth, get registered inside the `creators` collection, generate an OBS token, and access their dashboard.

---

## Onboarding Pipeline

```
Creator hits "Log In" or "Get Started"
  ➔ Redirected to Google OAuth consent screen
  ➔ Callback received on FastAPI backend
  ➔ Verify Google identity token
  ➔ Creator exists? Find doc and login
  ➔ New Creator? Create document, generate slug and OBS token
  ➔ Set session JWT inside secure cookie
  ➔ Redirect to Dashboard
```

---

## Step 1 — Google Developer Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project called `Sponsa`.
3. Go to **APIs & Services** → **OAuth Consent Screen**.
4. Choose **External** user type and complete developer details.
5. Under **Scopes**, select `openid`, `auth/userinfo.email`, and `auth/userinfo.profile`.
6. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**.
   - Application Type: **Web Application**
   - Authorized JavaScript origins: `http://localhost:8000` and `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:8000/api/auth/callback`
7. Copy the **Client ID** and **Client Secret** and add them to `.env`.

---

## Step 2 — Backend OAuth Routing

Create the authentication routes using `Authlib` inside the backend application:

```python
# server/routes/auth.py
import re
from fastapi import APIRouter, Request, HTTPException
from authlib.integrations.starlette_client import OAuth
from jose import jwt
from datetime import datetime, timedelta

from config import settings
from models.creator import Creator

router = APIRouter(prefix="/api/auth", tags=["auth"])

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

def create_session_token(creator_id: str) -> str:
    """Generate session JWT."""
    expire = datetime.utcnow() + timedelta(days=7)
    payload = {
        "sub": str(creator_id),
        "exp": expire
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

@router.get("/google")
async def google_login(request: Request):
    """Initiate Google OAuth login redirect."""
    redirect_uri = settings.google_redirect_uri
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/callback")
async def google_callback(request: Request):
    """Handle Google OAuth response callback."""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")
        if not user_info:
            raise HTTPException(400, "Failed to retrieve user info from Google")
    except Exception as e:
        raise HTTPException(400, f"Authentication failed: {str(e)}")

    google_id = user_info["sub"]
    email = user_info["email"]
    name = user_info["name"]
    picture = user_info.get("picture")

    # Check if creator already exists
    creator = await Creator.find_one(Creator.google_id == google_id)

    if not creator:
        # Generate slug from name
        base_slug = re.sub(r"[^a-z0-9]", "", name.lower()) or "creator"
        slug = base_slug
        attempt = 1
        while await Creator.find_one(Creator.slug == slug):
            slug = f"{base_slug}{attempt}"
            attempt += 1

        # Generate long random token for OBS authentication
        import secrets
        obs_token = secrets.token_hex(16)

        # Create creator document
        creator = Creator(
            google_id=google_id,
            email=email,
            slug=slug,
            display_name=name,
            avatar_url=picture,
            obs_token=obs_token
        )
        await creator.insert()

    # Generate session token and set in secure HttpOnly cookie
    session_token = create_session_token(creator.id)
    
    from fastapi.responses import RedirectResponse
    response = RedirectResponse(url=f"{settings.frontend_url}/dashboard")
    response.set_cookie(
        key="sponsa_session",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=604800  # 7 days
    )
    return response
```

---

## Step 3 — Current Creator Auth Dependency

Create a helper route dependency to fetch the authenticated user from the request session cookie:

```python
# server/routes/auth_helper.py
from fastapi import Request, HTTPException, Depends
from jose import jwt, JWTError
from bson import ObjectId

from config import settings
from models.creator import Creator

async def get_current_creator(request: Request) -> Creator:
    """Dependency to fetch current creator session from cookie."""
    token = request.cookies.get("sponsa_session")
    if not token:
        raise HTTPException(status_code=401, detail="Session expired or not found")
        
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        creator_id = payload.get("sub")
        if not creator_id:
            raise HTTPException(status_code=401, detail="Invalid session token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid session token")

    creator = await Creator.get(ObjectId(creator_id))
    if not creator:
        raise HTTPException(status_code=404, detail="Creator account not found")
    return creator
```

---

## Step 4 — Frontend Client Session & OAuth Initiator

### Google Login Button (Vite React)
```tsx
export default function LoginPage() {
  const handleLogin = () => {
    // Redirect browser directly to backend auth initiation route
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
  };

  return (
    <Button onClick={handleLogin}>
      Sign In With Google
    </Button>
  );
}
```

---

## Verification Checklist

- [ ] Google Cloud Client ID & Secret configured in env vars
- [ ] Calling `/api/auth/google` redirects browser to Google authentication screens
- [ ] Callback handles credential validation and sets secure HttpOnly cookie `sponsa_session`
- [ ] New user callback correctly generates unique OBS token and slug URL
- [ ] Fetching `/api/auth/me` verifies cookie validity and returns correct profile JSON
- [ ] Session validation handles missing or expired cookies with clean HTTP 401s
