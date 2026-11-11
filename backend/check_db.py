# Helpdesk database checker. Put this file in the backend folder (next to the "app" folder).
# Run:  python check_db.py
from sqlalchemy import inspect, text
from app.database import engine

print()
print("1) The backend is using this database:")
print("   ", engine.url.render_as_string(hide_password=True))
print()
try:
    with engine.connect() as conn:
        print("2) Connection: OK")
        tables = inspect(conn).get_table_names()
        print("3) Tables found:", tables if tables else "none yet (start the backend once to create them)")
        if "users" in tables:
            rows = conn.execute(text("SELECT id, full_name, email, role FROM users ORDER BY id")).fetchall()
            print("4) Accounts in this database:", len(rows))
            for r in rows:
                print("    ", r[0], "|", r[1], "|", r[2], "|", r[3])
except Exception as e:
    print("2) Connection: FAILED")
    print("   Reason:", type(e).__name__)
    print("   ", str(e).strip().splitlines()[0][:300] if str(e).strip() else "")
print()
