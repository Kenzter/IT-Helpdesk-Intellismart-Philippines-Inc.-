# Change a staff member's password using the SAME database the website uses.
# Put this file in the backend folder (next to the "app" folder), then run:
#   python set_password.py admin@helpdesk.com NewPasswordHere
import sys
from sqlalchemy import text
from app.auth import hash_password
from app.database import engine

if len(sys.argv) != 3 or len(sys.argv[2]) < 6 or len(sys.argv[2]) > 72:
    print("Usage: python set_password.py their@email.com NewPassword   (6 to 72 characters)")
    sys.exit(1)

email, password = sys.argv[1].strip().lower(), sys.argv[2]
print("Database:", engine.url.render_as_string(hide_password=True))
with engine.begin() as conn:
    n = conn.execute(text("UPDATE users SET hashed_password = :h WHERE email = :e"), {"h": hash_password(password), "e": email}).rowcount
print(f"Done: password changed for {email}." if n == 1 else f"No account found with the email {email}.")
