# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()

# 1. Resolve connection details
db_url = settings.get_database_url()

# 2. Try initializing the primary connection (Postgres/Supabase)
try:
    logger.info("Attempting connection to cloud Supabase/Postgres database...")
    url = make_url(db_url)
    connect_args = {}
    if url.drivername in {"postgresql", "postgresql+psycopg2", "postgresql+psycopg"}:
        connect_args["connect_timeout"] = 5

    engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
    # Quick probe test connection
    with engine.connect() as conn:
        logger.info("Successfully connected to primary cloud database!")
except Exception as e:
    logger.warning(
        f"Failed to connect to primary cloud database (Supabase offline or blocked): {str(e)}. "
        "Automatically falling back to local SQLite database (local_database.db)!"
    )
    # High-fidelity SQLite database fallback for stable local dev
    engine = create_engine(
        "sqlite:///local_database.db",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
