import re
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from jose import jwt

from config import settings
from models.creator import Creator
from routes.auth_helper import get_current_creator

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
        "exp": expire,
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
    except HTTPException:
        raise
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
        obs_token = secrets.token_hex(16)

        # Create creator document
        creator = Creator(
            google_id=google_id,
            email=email,
            slug=slug,
            display_name=name,
            avatar_url=picture,
            obs_token=obs_token,
        )
        await creator.insert()

    # Generate session token and set in secure HttpOnly cookie
    session_token = create_session_token(creator.id)

    response = RedirectResponse(url=f"{settings.frontend_url}/dashboard")
    response.set_cookie(
        key="sponsa_session",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=604800,  # 7 days
    )
    return response


@router.get("/me")
async def get_me(creator: Creator = Depends(get_current_creator)):
    """Return the authenticated creator's profile."""
    return {
        "id": str(creator.id),
        "email": creator.email,
        "display_name": creator.display_name,
        "slug": creator.slug,
        "avatar_url": creator.avatar_url,
        "youtube_url": creator.youtube_url,
        "upi_id": creator.upi_id,
        "upi_verified": creator.upi_verified,
        "wallet_balance": str(creator.wallet_balance),
        "obs_token": creator.obs_token,
    }
