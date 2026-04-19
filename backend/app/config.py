import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # 공공데이터포털 API 키 (일반 인증키 - Decoding)
    DATA_GO_KR_API_KEY: str = os.getenv("DATA_GO_KR_API_KEY", "")

    # DB
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://lem_user:lem_pass_2026@localhost:5432/life_env_map",
    )

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")


settings = Settings()
