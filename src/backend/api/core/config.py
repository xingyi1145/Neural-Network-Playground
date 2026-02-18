from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "FastAPI App"
    DATABASE_URL: str = "sqlite:///./nn_playground.db"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
