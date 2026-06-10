from fastapi import Request, HTTPException
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
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        creator_id = payload.get("sub")
        if not creator_id:
            raise HTTPException(status_code=401, detail="Invalid session token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid session token")

    creator = await Creator.get(ObjectId(creator_id))
    if not creator:
        raise HTTPException(status_code=404, detail="Creator account not found")
    return creator
