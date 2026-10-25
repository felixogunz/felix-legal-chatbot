import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")

    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
    DATABASE_PATH = str(BASE_DIR / "felix_legal.db")

    MAX_CONTENT_LENGTH = 10 * 1024 * 1024

    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USE_TLS = (
        os.getenv("MAIL_USE_TLS", "true").lower()
        in {"true", "1", "yes"}
    )

    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", "")
    
    # Resend email API
    RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()

    # Password-reset links remain valid for 30 minutes by default.
    PASSWORD_RESET_TOKEN_MAX_AGE = int(
        os.getenv("PASSWORD_RESET_TOKEN_MAX_AGE", "1800")
    )