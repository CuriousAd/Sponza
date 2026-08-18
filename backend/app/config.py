from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # MongoDB
    mongodb_uri: str
    mongodb_db_name: str = "sponza_dev"

    # Server
    port: int = 8000
    frontend_url: str = "http://localhost:8080"
    jwt_secret: str
    jwt_algorithm: str = "HS256"

    # Google OAuth
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str = "http://localhost:8000/api/auth/callback"

    # Cashfree PG
    cashfree_client_id: str
    cashfree_client_secret: str
    cashfree_webhook_secret: str
    cashfree_api_version: str = "2025-01-01"
    cashfree_base_url: str = "https://sandbox.cashfree.com/pg"

    # Cashfree Payouts
    cashfree_payout_client_id: str = ""
    cashfree_payout_client_secret: str = ""
    cashfree_payout_base_url: str = "https://payout-gamma.cashfree.com/payout"

    class Config:
        env_file = ".env"


settings = Settings()
