import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# PostgreSQL example: postgresql://user:pass@localhost:5432/helpdesk
# Defaults to a local SQLite file so the app runs with zero setup.

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://USER:PASSWORD@localhost:5432/DB_NAME")

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
