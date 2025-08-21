from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()
# FOR SYNC
# DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./crm.db")
DATABASE_URL = "sqlite:///./crm.db"
SyncEngine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=SyncEngine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ///////////
# /////////
# FOR ASYNC

ASYNC_DATABASE_URL = "sqlite+aiosqlite:///./crm.db"
AsyncEngine = create_async_engine(ASYNC_DATABASE_URL, echo=True)

AsyncSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=AsyncEngine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_db_async():
    session = AsyncSessionLocal()
    try:
        yield session
    except Exception:
        raise
    finally:
        await session.close()


Base = declarative_base()
