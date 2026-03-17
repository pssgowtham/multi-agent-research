from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    OPENAI_API_KEY: str
    EXA_API_KEY: str
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str
    LANGCHAIN_API_KEY: str
    LANGCHAIN_TRACING_V2: str = "true"
    LANGCHAIN_PROJECT: str = "multi-agent-research"
    SENTRY_DSN: str
    APP_ENV: str = "development"
    MAX_CRITIC_ITERATIONS: int = 3

    class Config:
        env_file = ".env"

settings = Settings()