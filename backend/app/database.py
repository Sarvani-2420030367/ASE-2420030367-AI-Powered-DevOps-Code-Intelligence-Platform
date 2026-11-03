import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("devsight.database")
logging.basicConfig(level=logging.INFO)

Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    try:
        if db_url.startswith("mysql"):
            # Attempt to verify connection with a short timeout
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"connect_timeout": 3}
            )
            with engine.connect() as conn:
                logger.info("Successfully connected to MySQL database.")
            return engine
    except Exception as e:
        logger.warning(f"MySQL connection failed ({e}). Falling back to local SQLite database.")
    
    # SQLite fallback
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "generated"))
    os.makedirs(data_dir, exist_ok=True)
    sqlite_path = os.path.join(data_dir, "devsight.db")
    sqlite_url = f"sqlite:///{sqlite_path}"
    logger.info(f"Using SQLite database at {sqlite_path}")
    return create_engine(sqlite_url, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
