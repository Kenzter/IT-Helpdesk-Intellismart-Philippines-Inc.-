import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# PostgreSQL example: postgresql://user:pass@localhost:5432/helpdesk
# Defaults to a local SQLite file so the app runs with zero setup.

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Your_DB_Pass@localhost:5432/Your_DB_Name")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
