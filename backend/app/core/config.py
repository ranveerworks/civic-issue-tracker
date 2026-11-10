import os
from pathlib import Path

# Root project path for backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings:
    PROJECT_NAME: str = "Civic Issue Tracker"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment variables with sensible defaults
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "mysql+pymysql://root:root@localhost:3306/civic_issue_tracker"
    )
    ALLOW_SQLITE_FALLBACK: bool = os.getenv("ALLOW_SQLITE_FALLBACK", "true").lower() in ("true", "1", "yes")
    
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", 
        "civic-issue-tracker-sharda-university-secret-key-2026-pbl-secure"
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # Admin seed
    ADMIN_NAME: str = os.getenv("ADMIN_NAME", "Civic Administrator")
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@civictracker.gov.in")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "Admin@123")
    ADMIN_MOBILE: str = os.getenv("ADMIN_MOBILE", "+91 9876543210")
    
    # Uploads
    UPLOAD_DIR: Path = BASE_DIR / os.getenv("UPLOAD_DIR", "uploads")
    
    # CORS
    _cors_raw: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:3000"
    )
    CORS_ORIGINS: list[str] = [origin.strip() for origin in _cors_raw.split(",") if origin.strip()]

settings = Settings()
