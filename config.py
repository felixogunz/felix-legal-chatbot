import os
from pathlib import Path

from dotenv import load_dotenv


# Felix Legal Chatbot
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from .env when running locally.
load_dotenv(BASE_DIR / ".env")


class Config:
    # OpenAI API settings
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    # Flask security
    # Set SECRET_KEY in .env before deploying.
    SECRET_KEY = os.getenv("SECRET_KEY")

    # PostgreSQL connection.
    # If DATABASE_URL is not set, use SQLite locally.
    DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

    # Existing local SQLite database.
    DATABASE_PATH = str(BASE_DIR / "felix_legal.db")

    # Maximum uploaded file size: 10 MB
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024

    # Gmail SMTP settings
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))

    MAIL_USE_TLS = os.getenv(
        "MAIL_USE_TLS", "true"
    ).lower() in {"true", "1", "yes"}

    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")

    MAIL_DEFAULT_SENDER = os.getenv(
        "MAIL_DEFAULT_SENDER", ""
    )

    # Password-reset links expire after 30 minutes.
    PASSWORD_RESET_TOKEN_MAX_AGE = int(
        os.getenv("PASSWORD_RESET_TOKEN_MAX_AGE", "1800")
    )
