"""Application settings and configuration."""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Gemini API (Google ADK uses GOOGLE_GENAI_API_KEY)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # Backend API
    backend_api_url: str = "http://backend:3001"

    # Server
    agent_port: int = 8000
    log_level: str = "INFO"

    # Session
    session_ttl_hours: int = 24
    max_conversation_length: int = 50

    # Rate limiting
    requests_per_minute: int = 20
    requests_per_day: int = 500

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra env vars like GOOGLE_GENAI_API_KEY

    def model_post_init(self, __context) -> None:
        """Called after model initialization to set up Google ADK environment."""
        if self.gemini_api_key:
            os.environ["GOOGLE_GENAI_API_KEY"] = self.gemini_api_key


settings = Settings()
