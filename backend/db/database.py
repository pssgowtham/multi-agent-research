from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from backend.core.config import settings
import ssl

db_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://").replace("?sslmode=require", "")

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

engine = create_async_engine(
    db_url,
    echo=False,
    connect_args={
        "ssl": ssl_context,
        "statement_cache_size": 0
    },
    pool_pre_ping=True,        # ← checks connection before using it
    pool_recycle=300,          # ← recycle connections every 5 minutes
    pool_size=5,               # ← max 5 connections
    max_overflow=10            # ← allow 10 overflow connections
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()