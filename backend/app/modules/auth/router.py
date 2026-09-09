from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import RedirectResponse
from app.config import settings
from app.core.dependencies import get_current_creator
from app.modules.auth.schemas import AuthResponse
from app.modules.auth.service import oauth, get_or_create_google_creator
from app.modules.creators.models import Creator

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.get("/google")
async def google_login(request: Request):
    """Redirect to Google Consent screen for OAuth login."""
    redirect_uri = settings.google_redirect_uri
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/callback")
async def google_callback(request: Request):
    """Handle Google OAuth callback, issue JWT session cookie, redirect to dashboard."""
    token_dict = await oauth.google.authorize_access_token(request)
    user_info = token_dict.get("userinfo")
    if not user_info:
        user_info = await oauth.google.parse_id_token(request, token_dict)

    creator, jwt_token = await get_or_create_google_creator(user_info)

    is_https = settings.frontend_url.startswith("https")
    response = RedirectResponse(url=f"{settings.frontend_url}/dashboard")
    response.set_cookie(
        key="sponsa_session",
        value=jwt_token,
        httponly=True,
        samesite="lax",
        secure=is_https,
        max_age=604800,  # 7 days
    )
    return response


@router.get("/me", response_model=AuthResponse)
async def check_auth_status(creator: Creator | None = Depends(get_current_creator)):
    """Check current authenticated session status."""
    if not creator:
        return AuthResponse(authenticated=False)
    return AuthResponse(
        authenticated=True,
        creator_id=str(creator.id),
        email=creator.email,
        display_name=creator.display_name,
    )


@router.post("/logout")
async def logout(response: Response):
    """Clear session cookie."""
    is_https = settings.frontend_url.startswith("https")
    response.delete_cookie(
        "sponsa_session",
        httponly=True,
        samesite="lax",
        secure=is_https,
    )
    return {"message": "Logged out successfully"}
