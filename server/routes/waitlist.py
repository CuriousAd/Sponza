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