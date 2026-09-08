from fastapi import Request, HTTPException, status
from app.core.security import decode_jwt_token
from app.modules.creators.models import Creator


async def get_current_creator(request: Request) -> Creator | None:
    """Dependency that returns the authenticated Creator from JWT session cookie or Authorization header."""
    token = request.cookies.get("sponsa_session")

    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        return None

    try:
        payload = decode_jwt_token(token)
        creator_id = payload.get("sub")
        if not creator_id:
            return None
        return await Creator.get(creator_id)
    except Exception:
        return None


async def require_current_creator(request: Request) -> Creator:
    """Dependency enforcing authenticated Creator context."""
    creator = await get_current_creator(request)
    if not creator:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return creator
