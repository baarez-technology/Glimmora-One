from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite+aiosqlite:///./dev.db"
    jwt_secret: str = "dev-secret-change-me-please-make-it-long"
    jwt_algorithm: str = "HS256"
    jwt_expires_hours: int = 24

    bootstrap_superadmin_username: str = "superadmin"
    bootstrap_superadmin_password: str = "1"
    bootstrap_superadmin_email: str = "admin@glimmora.ai"

    allowed_origins: str = "http://localhost:3000"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_embed_model: str = "text-embedding-3-small"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def ai_enabled(self) -> bool:
        return bool(self.openai_api_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
