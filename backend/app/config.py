import os
from typing import List

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/devsight")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "devsight_jwt_secret_key_2026_antigravity_safe")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    CORS_ORIGINS_RAW: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "generated", "uploads")))

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS_RAW.split(",") if origin.strip()]

settings = Settings()
