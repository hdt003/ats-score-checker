import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "ATS Resume Analyzer & Job Match Engine"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database Configuration (SQLite default, PostgreSQL via DATABASE_URL)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ats_analyzer.db")
    
    # Gemini AI Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_PRIMARY_MODEL: str = os.getenv("GEMINI_PRIMARY_MODEL", "gemini-2.5-flash")
    GEMINI_FAST_MODEL: str = os.getenv("GEMINI_FAST_MODEL", "gemini-2.5-flash-lite")
    GEMINI_EMBEDDING_MODEL: str = os.getenv("GEMINI_EMBEDDING_MODEL", "text-embedding-004")
    
    # Default Scoring Weights (Configurable & Transparent)
    SCORING_WEIGHTS = {
        "parsing": 0.20,
        "keywords": 0.20,
        "requirements": 0.25,
        "experience": 0.15,
        "achievements": 0.10,
        "formatting": 0.10
    }

settings = Settings()
