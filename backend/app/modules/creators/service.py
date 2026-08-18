import secrets
import re
from app.modules.creators.models import Creator
from app.modules.creators.schemas import CreatorUpdate


async def generate_unique_slug(base_name: str) -> str:
    slug_base = re.sub(r"[^a-zA-Z0-9]", "", base_name.lower()) or "creator"
    slug = slug_base
    counter = 1
    while await Creator.find_one(Creator.slug == slug):
        slug = f"{slug_base}{counter}"
        counter += 1
    return slug


async def generate_unique_obs_token() -> str:
    while True:
        token = secrets.token_hex(16)
        if not await Creator.find_one(Creator.obs_token == token):
            return token


async def update_creator_profile(creator: Creator, updates: CreatorUpdate) -> Creator:
    if updates.display_name:
        creator.display_name = updates.display_name
    if updates.youtube_url is not None:
        creator.youtube_url = updates.youtube_url
    if updates.upi_id is not None:
        creator.upi_id = updates.upi_id
    await creator.save()
    return creator
