import os
from pathlib import Path

from pydantic_settings import BaseSettings

# Project root is two levels up from this file (backend/app/core/config.py -> project root)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://rentos_user:rentos_password@localhost:5432/rentos"
    GOOGLE_CLOUD_PROJECT: str = ""
    GCS_BUCKET_NAME: str = "rent-ai-bucket-2803"
    GOOGLE_APPLICATION_CREDENTIALS: str = "./service-account.json"
    VERTEX_AI_LOCATION: str = "global"
    VERTEX_AI_MODEL: str = "gemini-2.5-flash-lite"
    CORS_ORIGINS: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Resolve credentials path relative to project root if it's a relative path
_creds_path = settings.GOOGLE_APPLICATION_CREDENTIALS
if _creds_path and not os.path.isabs(_creds_path):
    resolved = PROJECT_ROOT / _creds_path
    if resolved.exists():
        _creds_path = str(resolved)

# Set env vars so Google Cloud SDK picks them up (same pattern as google_cloud_examples.py)
if _creds_path:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = _creds_path
if settings.GOOGLE_CLOUD_PROJECT:
    os.environ["GOOGLE_CLOUD_PROJECT"] = settings.GOOGLE_CLOUD_PROJECT
