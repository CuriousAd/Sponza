import logging
from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from app.config import settings
from app.core.security import create_jwt_token
from app.modules.creators.models import Creator
from app.modules.creators.service import generate_unique_slug, generate_unique_obs_token

logger = logging.getLogger("sponza.auth.service")

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


async def get_or_create_google_creator(user_info: dict) -> tuple[Creator, str]:
    google_id = user_info.get("sub")
    email = user_info.get("email")
    name = user_info.get("name") or "Creator"
    picture = user_info.get("picture")

    if not google_id or not email:
        raise ValueError("Invalid Google OAuth user info")

    creator = await Creator.find_one(Creator.google_id == google_id)
    if not creator:
        creator = await Creator.find_one(Creator.email == email)

    if not creator:
        slug = await generate_unique_slug(name)
        obs_token = await generate_unique_obs_token()
        creator = Creator(
            google_id=google_id,
            email=email,
            slug=slug,
            display_name=name,
            avatar_url=picture,
            obs_token=obs_token,
        )
        await creator.insert()
        logger.info(f"Created new creator profile for {email} with slug '{slug}'")

    token = create_jwt_token({"sub": str(creator.id), "email": creator.email})
    return creator, token
