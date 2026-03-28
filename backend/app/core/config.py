from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://rentos_user:rentos_password@localhost:5432/rentos"
    GEMINI_API_KEY: str = ""
    GCP_PROJECT_ID: str = ""
    GCS_BUCKET_NAME: str = "rentos-apartment-photos"
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    CORS_ORIGINS: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
