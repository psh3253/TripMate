from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""
    REDIS_URL: str = "redis://localhost:6379"
    PORT: int = 8000
    DEBUG: bool = True

    # Korea Tourism Organization API
    TOUR_API_KEY: str = ""
    TOUR_API_BASE_URL: str = "https://apis.data.go.kr/B551011/KorService2"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
