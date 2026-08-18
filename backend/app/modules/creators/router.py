from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import require_current_creator
from app.modules.creators.models import Creator
from app.modules.creators.schemas import CreatorResponse, CreatorUpdate
from app.modules.creators.service import update_creator_profile

router = APIRouter(prefix="/api/creators", tags=["Creators"])


@router.get("/me", response_model=CreatorResponse)
async def get_my_profile(creator: Creator = Depends(require_current_creator)):
    return CreatorResponse(
        id=str(creator.id),
        slug=creator.slug,
        display_name=creator.display_name,
        email=creator.email,
        avatar_url=creator.avatar_url,
        youtube_url=creator.youtube_url,
        upi_id=creator.upi_id,
        upi_verified=creator.upi_verified,
        wallet_balance=str(creator.wallet_balance),
        obs_token=creator.obs_token,
    )


@router.get("/public/{slug}")
async def get_public_creator_profile(slug: str):
    creator = await Creator.find_one(Creator.slug == slug)
    if not creator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Creator not found")
    return {
        "slug": creator.slug,
        "display_name": creator.display_name,
        "avatar_url": creator.avatar_url,
        "youtube_url": creator.youtube_url,
    }


@router.patch("/me", response_model=CreatorResponse)
async def update_my_profile(
    updates: CreatorUpdate,
    creator: Creator = Depends(require_current_creator),
):
    updated = await update_creator_profile(creator, updates)
    return CreatorResponse(
        id=str(updated.id),
        slug=updated.slug,
        display_name=updated.display_name,
        email=updated.email,
        avatar_url=updated.avatar_url,
        youtube_url=updated.youtube_url,
        upi_id=updated.upi_id,
        upi_verified=updated.upi_verified,
        wallet_balance=str(updated.wallet_balance),
        obs_token=updated.obs_token,
    )
