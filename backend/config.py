"""
Application configuration loaded from environment variables.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Google Cloud / Firebase
    google_cloud_project: str = "myhack-bf3ce"
    firestore_database: str = "myhack"

    # Gemini API
    google_api_key: str = ""

    # Vertex AI
    vertex_ai_location: str = "us-central1"

    # Matching pipeline settings
    hard_filter_max_candidates: int = 20
    embedding_top_k: int = 10
    gemini_model: str = "gemini-2.5-flash"
    embedding_model: str = "text-embedding-005"

    # Firebase service account key path
    google_application_credentials: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


import os

@lru_cache()
def get_settings() -> Settings:
    return Settings()
