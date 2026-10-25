from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./promptguard.db"

    SECRET_KEY: str = Field(
        default="change-this-in-production-use-32+",
        min_length=32,
    )

    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    CORS_ORIGINS: str = "http://localhost:3000"

    WEB_MAX_RESPONSE_SIZE: int = 5 * 1024 * 1024
    WEB_MAX_REDIRECTS: int = 5
    WEB_CONNECT_TIMEOUT: float = 5.0
    WEB_READ_TIMEOUT: float = 15.0
    WEB_WRITE_TIMEOUT: float = 5.0
    WEB_POOL_TIMEOUT: float = 5.0
    WEB_MAX_URL_LENGTH: int = 2048

    LLM_BASE_URL: str | None = None
    LLM_API_KEY: str | None = None
    LLM_MODEL: str | None = None
    LLM_TIMEOUT: float = 30.0
    LLM_MAX_RESPONSE_SIZE: int = 1024 * 1024

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()