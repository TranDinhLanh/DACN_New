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

# 2. Initialize the primary connection (Postgres/Supabase)
url = make_url(db_url)
connect_args = {}
if url.drivername in {"postgresql", "postgresql+psycopg2", "postgresql+psycopg"}:
    connect_args["connect_timeout"] = 10

logger.info("Connecting to primary cloud database (Supabase)...")
engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
