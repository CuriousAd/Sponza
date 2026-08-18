import base64
import hmac
import hashlib
from datetime import datetime, timedelta, timezone
import jwt
import bleach
from app.config import settings


def create_jwt_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=7)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_jwt_token(token: str) -> dict:
    """Decode and verify a JWT token."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def verify_cashfree_signature(raw_body: bytes, timestamp: str, signature: str) -> bool:
    """Verify Cashfree HMAC-SHA256 signature."""
    if not signature or not timestamp:
        return False
    data_to_sign = timestamp.encode("utf-8") + raw_body
    computed_hmac = hmac.new(
        settings.cashfree_webhook_secret.encode("utf-8"),
        data_to_sign,
        hashlib.sha256,
    ).digest()
    computed_signature = base64.b64encode(computed_hmac).decode("utf-8")
    return hmac.compare_digest(computed_signature, signature)


def sanitize_text(text: str | None) -> str | None:
    """Strip HTML tags and sanitize viewer/donor input."""
    if not text:
        return text
    return bleach.clean(text, tags=[], strip=True).strip()
