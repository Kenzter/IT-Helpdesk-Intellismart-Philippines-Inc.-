import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine, SessionLocal
from . import models
from .auth import SECRET_KEY, hash_password
from sqlalchemy import inspect, text
from .routers import auth, tickets, users, stats, public


def seed_admin():
    """Create a default IT agent on first run (override with ADMIN_EMAIL / ADMIN_PASSWORD)."""
    db = SessionLocal()
    try:
        if not db.query(models.User).filter(models.User.role == "ADMIN").first():
            db.add(models.User(
                email=os.getenv("ADMIN_EMAIL", "admin@example.com"),
                full_name="IT Admin",
<<<<<<< HEAD
                hashed_password=hash_password(os.getenv("ADMIN_PASSWORD", "Your-Password-Here")),
=======
                hashed_password=hash_password(os.getenv("ADMIN_PASSWORD", "Your_Password")),
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe
                role="ADMIN"))
            db.commit()
    finally:
        db.close()


def _sqlite_make_reporter_optional(conn):
    """SQLite cannot drop NOT NULL in place, so copy the tickets into a corrected table (all data kept)."""
    conn.execute(text("""CREATE TABLE tickets_new (
        id INTEGER NOT NULL PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT NOT NULL,
        category VARCHAR(60) NOT NULL, department VARCHAR(50), requester_name VARCHAR(255),
        status VARCHAR(15) NOT NULL, reporter_id INTEGER, assigned_to_id INTEGER,
        created_at DATETIME, updated_at DATETIME,
        FOREIGN KEY(reporter_id) REFERENCES users (id), FOREIGN KEY(assigned_to_id) REFERENCES users (id))"""))
    cols = "id, title, description, category, department, requester_name, status, reporter_id, assigned_to_id, created_at, updated_at"
    conn.execute(text(f"INSERT INTO tickets_new ({cols}) SELECT {cols} FROM tickets"))
    conn.execute(text("DROP TABLE tickets"))
    conn.execute(text("ALTER TABLE tickets_new RENAME TO tickets"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tickets_id ON tickets (id)"))


def migrate():
    """Upgrade an older database in place. Existing tickets, comments and accounts are kept."""
    insp = inspect(engine)
    if "tickets" not in insp.get_table_names():
        return
    cols = {c["name"]: c for c in insp.get_columns("tickets")}
    ucols = {c["name"] for c in insp.get_columns("users")}
    with engine.begin() as conn:
        if "department" not in ucols:
            conn.execute(text("ALTER TABLE users ADD COLUMN department VARCHAR(50)"))
        if "account_status" not in ucols:  # everyone who already exists stays approved
            conn.execute(text("ALTER TABLE users ADD COLUMN account_status VARCHAR(10) NOT NULL DEFAULT 'APPROVED'"))
        if "department" not in cols:
            conn.execute(text("ALTER TABLE tickets ADD COLUMN department VARCHAR(50)"))
        # The new category names are longer than the old 20-character column (PostgreSQL enforces this).
        if engine.dialect.name == "postgresql":
            cat = cols.get("category")
            if cat is not None and (getattr(cat["type"], "length", None) or 60) < 60:
                conn.execute(text("ALTER TABLE tickets ALTER COLUMN category TYPE VARCHAR(60)"))
        if "priority" in cols:
            conn.execute(text("ALTER TABLE tickets DROP COLUMN priority"))
        # Public tickets store the employee's name on the ticket. Older tickets keep their reporter's name.
        if "requester_name" not in cols:
            conn.execute(text("ALTER TABLE tickets ADD COLUMN requester_name VARCHAR(255)"))
        conn.execute(text("UPDATE tickets SET requester_name = (SELECT full_name FROM users WHERE users.id = tickets.reporter_id) "
                          "WHERE requester_name IS NULL AND reporter_id IS NOT NULL"))
        # Public tickets have no reporter account, so reporter_id must be allowed to be empty.
        if cols["reporter_id"].get("nullable") is False:
            if engine.dialect.name == "postgresql":
                conn.execute(text("ALTER TABLE tickets ALTER COLUMN reporter_id DROP NOT NULL"))
            elif engine.dialect.name == "sqlite":
                _sqlite_make_reporter_optional(conn)
        # Persist who last corrected the employee-submitted ticket information.
        current_cols = {c["name"] for c in inspect(conn).get_columns("tickets")}
        if "last_edited_by_id" not in current_cols:
            conn.execute(text("ALTER TABLE tickets ADD COLUMN last_edited_by_id INTEGER REFERENCES users (id)"))
        if "last_edited_at" not in current_cols:
            timestamp_type = "TIMESTAMP WITH TIME ZONE" if engine.dialect.name == "postgresql" else "DATETIME"
            conn.execute(text(f"ALTER TABLE tickets ADD COLUMN last_edited_at {timestamp_type}"))
<<<<<<< HEAD
        # Priority level (P1-P4) chosen by IT staff. Existing tickets stay empty (not set).
        if "priority_level" not in current_cols:
            conn.execute(text("ALTER TABLE tickets ADD COLUMN priority_level VARCHAR(2)"))
=======
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    migrate()
    if SECRET_KEY == "change-me-in-production":
        print("WARNING: SECRET_KEY is not set. Set a long random SECRET_KEY before using this on a real network.")
    seed_admin()
    yield


# Addresses of the website that may talk to this server. Set ALLOWED_ORIGINS to a
# comma-separated list for deployment, e.g. "http://helpdesk.mycompany.com".
ALLOWED_ORIGINS = [o.strip() for o in os.getenv(
<<<<<<< HEAD
    "ALLOWED_ORIGINS", "YOUR NETWORK IP ADDRESS HERE,http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]
=======
    "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe

_docs_off = os.getenv("DISABLE_DOCS") == "1"  # set DISABLE_DOCS=1 on the real server
app = FastAPI(title="IT Helpdesk API", version="1.0.0", lifespan=lifespan,
              docs_url=None if _docs_off else "/docs", redoc_url=None if _docs_off else "/redoc",
              openapi_url=None if _docs_off else "/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(public.router)
app.include_router(tickets.router)
app.include_router(users.router)
app.include_router(stats.router)


@app.get("/")
def health():
    return {"status": "ok"}
