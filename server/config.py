from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_uri: str
    mongodb_db_name: str = "sponsa_dev"
    port: int = 8000
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()