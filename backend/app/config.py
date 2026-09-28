"""Typed application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DrugSpot API"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite+aiosqlite:///./drugspot.db"
    auth_secret: str = "development-only-secret-change-me-now"
    access_token_minutes: int = Field(default=15, ge=5, le=1440)
    refresh_token_days: int = Field(default=30, ge=1, le=90)
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5175,http://127.0.0.1:5175"
    nafdac_api_base_url: str = "https://greenbook.nafdac.gov.ng"
    nafdac_api_timeout_seconds: float = Field(default=12, ge=2, le=30)
    ocr_space_api_key: str = ""
    ocr_space_api_url: str = "https://api.ocr.space/parse/image"
    ocr_space_timeout_seconds: float = Field(default=25, ge=5, le=60)

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("auth_secret")
    @classmethod
    def validate_secret(cls, value: str) -> str:
        if len(value) < 32:
            raise ValueError("AUTH_SECRET must contain at least 32 characters")
        return value

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
