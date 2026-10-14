import os
from pathlib import Path

from dotenv import load_dotenv


# Locate the project directory.
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from .env when running locally.
load_dotenv(BASE_DIR / ".env")


class Config:
    # OpenAI API settings
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    # Flask security
    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "development-only-change-this",
    )

    # PostgreSQL connection.
    # If DATABASE_URL is not set, use SQLite locally.
    DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

    # Existing local SQLite database.
    DATABASE_PATH = str(BASE_DIR / "felix_legal.db")

    # Maximum uploaded file size: 10 MB
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024
