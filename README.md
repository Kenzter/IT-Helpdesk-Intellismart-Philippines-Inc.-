# ITI Helpdesk

A web-based IT helpdesk and ticketing system for **Intellismart IT Services**. Employees submit IT concerns through a public form (no account needed). The IT Department signs in to track, assign, prioritize, resolve and audit those tickets.

> © 2026 ITI Helpdesk | All rights reserved

---

## Table of Contents

1. [Features](#features)
2. [User Roles](#user-roles)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Installation and Setup](#installation-and-setup)
7. [Configuration](#configuration)
8. [Running the System](#running-the-system)
9. [Database](#database)
10. [API Overview](#api-overview)
11. [Running 24/7 on a Windows PC](#running-247-on-a-windows-pc)
12. [Backup and Restore](#backup-and-restore)
13. [Security Notes](#security-notes)
14. [Troubleshooting](#troubleshooting)
15. [Credits](#credits)

---

## Features

**Employees (no login)**
- Public ticket form at `/new-ticket`: name, department, issue category, subject and description.
- Ticket number shown after submission to follow up with IT.
- Spam protection: hidden trap field, per-connection rate limit, and duplicate-submission guard.

**IT Admin and IT Assistant (login required)**
- **Dashboard:** Monthly, Yearly and Overall ticket summaries.
- **Tickets page:** status tabs (All, Open, In Progress, Resolved, Closed), search by ID/title/description, filters by category, department and **month/year**, and an "Assigned to me" shortcut.
- **Ticket details:** edit ticket information (with a "last edited by, date and time" stamp), assign a technician, change status, mark as resolved, and post notes/comments.
- **Priority levels:** assign P1 to P4 with color-coded badges on the list and detail views, plus a Priority legend.
- **Live ticket alerts** for new tickets.
- **About Us** page with the development team.

**IT Admin only**
- **IT Staff** page: create IT assistant accounts and approve or reject accounts.
- **Delete Resolved tickets**, individually or in bulk.
- **Deletion Logs:** a permanent audit trail. Every deleted ticket is saved with its details, who deleted it, and when. The record remains even after the ticket is gone.

---

## User Roles

| Capability | Employee (no account) | IT Assistant | IT Admin |
|---|:---:|:---:|:---:|
| Submit a ticket (public form) | Yes | Yes | Yes |
| Sign in | No | Yes | Yes |
| View dashboard and all tickets | No | Yes | Yes |
| Edit ticket info, assign, change status, comment | No | Yes | Yes |
| Set priority level | No | Yes | Yes |
| Assign tickets to the IT Admin | No | No | Yes |
| Delete tickets (Resolved only) | No | No | Yes |
| View Deletion Logs | No | No | Yes |
| Manage IT Staff accounts | No | No | Yes |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, Pydantic, Uvicorn |
| Auth | JWT (python-jose), bcrypt password hashing (passlib) |
| Database | PostgreSQL (SQLite is supported as a simple fallback) |
| Frontend | React 18, TypeScript, Vite, React Router, Axios |
| Styling | Tailwind CSS |

---

## Project Structure

```
ITI-HelpDesk/
├── backend/
│   └── app/
│       ├── main.py          # App entry: startup, CORS, routers, DB migration, default admin
│       ├── auth.py          # Password hashing, JWT, require_staff / require_admin
│       ├── config.py        # Email-domain rule and public-form spam limits
│       ├── database.py      # Database connection and session
│       ├── models.py        # Tables: users, tickets, comments, ticket_deletion_logs
│       ├── schemas.py       # Request/response schemas (Pydantic)
│       └── routers/
│           ├── auth.py      # Login
│           ├── public.py    # Public ticket submission
│           ├── tickets.py   # Tickets, comments, priority, deletion, deletion logs
│           ├── users.py     # IT staff accounts
│           └── stats.py     # Dashboard numbers
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.ts / tailwind.config.js / tsconfig.json
    ├── public/              # Optional static files (e.g. developer photo)
    └── src/
        ├── App.tsx          # Routes and role-protected routes
        ├── api/client.ts    # Axios client, types, token handling
        ├── components/      # AuthShell, Navbar, LiveTicketAlerts, StatusBadge,
        │                    # PriorityBadge, PriorityLegend, Footer
        └── pages/           # Login, PublicTicket, Dashboard, Tickets, TicketDetail,
                             # Accounts (IT Staff), DeletionLogs, About
```

---

## Prerequisites

- **Python 3.10 or newer**
- **Node.js 18 or newer** (with npm)
- **PostgreSQL** (an empty database, for example named `Helpdesk`, plus a user with access to it)

---

## Installation and Setup

### 1. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install fastapi "uvicorn[standard]" sqlalchemy psycopg2-binary pydantic email-validator \
            "python-jose[cryptography]" "passlib[bcrypt]" python-multipart
```

Then save your exact working versions so the setup can be repeated on another PC:

```bash
pip freeze > requirements.txt
# later, on a new machine:
pip install -r requirements.txt
```

> Tip: if you see bcrypt errors at login, the installed `bcrypt` is too new for `passlib`. Installing `bcrypt==4.0.1` fixes it.

### 2. Frontend

```bash
cd frontend
npm install
```

---

## Configuration

The backend reads its settings from **environment variables**. Set them in your terminal, in your startup script, or in the service settings. Never write real passwords in the source code or commit them.

| Variable | Purpose | Notes |
|---|---|---|
| `DATABASE_URL` | Database connection | e.g. `postgresql://USER:PASSWORD@localhost:5432/Helpdesk`. Special characters in the password must be URL-encoded. |
| `SECRET_KEY` | Signs login tokens | **Required in production.** Use a long random value (see below). |
| `ADMIN_EMAIL` | Email of the first IT Admin | Default `admin@helpdesk.com` |
| `ADMIN_PASSWORD` | Password of the first IT Admin | Used only when no admin exists yet. Set your own and change it after first login. |
| `ALLOWED_ORIGINS` | Websites allowed to call the API (CORS) | Comma-separated, e.g. `http://192.168.0.10:8080`. Must match the address you open in the browser. |
| `DISABLE_DOCS` | Set to `1` to hide `/docs` | Recommended on the real server. |
| `TOKEN_EXPIRE_MINUTES` | Login lifetime | Default `480` (8 hours) |
| `COMPANY_EMAIL_DOMAINS` | Allowed email domains for accounts | Comma-separated, e.g. `mycompany.com`. If empty, personal emails (Gmail, Yahoo, etc.) are blocked. |
| `PUBLIC_RATE_LIMIT` | Tickets allowed per connection | Default `10` |
| `PUBLIC_RATE_WINDOW_SECONDS` | Window for the rate limit | Default `600` |

Frontend (optional): `VITE_API_URL` sets the API address. If not set, the frontend calls the same host on port `8000`.

**Generate a secret key:**

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

> If `SECRET_KEY` is generated fresh on every start (for example inside a startup script), everyone is signed out whenever the backend restarts. Use a fixed saved value to keep sessions across restarts.

---

## Running the System

### Backend

From the `backend` folder with the virtual environment active:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- Health check: `http://localhost:8000/`
- Interactive API docs: `http://localhost:8000/docs` (hidden when `DISABLE_DOCS=1`)

On first start the backend creates the database tables and the default IT Admin account (see [Database](#database)).

### Frontend (development)

```bash
cd frontend
npm run dev
```

Opens at `http://localhost:5173`.

### Frontend (production)

```bash
cd frontend
npm run build
```

This runs the TypeScript check and creates the `dist/` folder. Serve the contents of `dist/` with any static web server (for example on port 8080). After every code change, rebuild and redeploy `dist/`, then refresh the browser with Ctrl+F5.

### First login

Open the site, go to the login page, and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Employees use `/new-ticket` and need no account.

---

## Database

Tables are created and upgraded **automatically** when the backend starts. Existing data is never dropped.

| Table | Contents |
|---|---|
| `users` | IT Admin and IT Assistant accounts |
| `tickets` | All tickets, including `priority_level` (`P1`, `P2`, `P3`, `P4`) |
| `comments` | Notes on tickets |
| `ticket_deletion_logs` | Permanent audit snapshot of every deleted ticket |

Notes:
- `ticket_deletion_logs` deliberately has **no foreign keys**, so records survive deletion of the ticket (and of the admin account).
- Each deletion and its audit record are saved in one transaction, so a ticket can never be deleted without its log entry.
- The priority column is named `priority_level` because the startup migration removes a legacy column named `priority`.
- The database itself (for example `Helpdesk`) must exist before the first start. The app creates the tables inside it.

---

## API Overview

All staff endpoints need `Authorization: Bearer <token>` from the login endpoint.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/public/tickets` | Public | Submit a ticket |
| POST | `/auth/login` | Public | Sign in, returns a token |
| GET | `/auth/me` | Staff | Current user |
| GET | `/tickets` | Staff | List tickets (filters: `status`, `department`, `category`, `q`, `assigned_to_id`) |
| GET | `/tickets/assigned-count` | Staff | Open tickets assigned to me |
| GET | `/tickets/{id}` | Staff | Ticket with notes |
| PATCH | `/tickets/{id}` | Staff | Edit info, status, assignee, `priority_level` |
| POST | `/tickets/{id}/comments` | Staff | Add a note |
| DELETE | `/tickets/{id}` | Admin | Delete a Resolved ticket (writes an audit log) |
| POST | `/tickets/bulk-delete` | Admin | Delete many Resolved tickets (one audit log each) |
| GET | `/tickets/deletion-logs` | Admin | Deletion history, newest first |
| GET | `/users` | Staff | List users (`?staff=true` for IT agents) |
| GET | `/users/accounts` | Admin | List staff accounts |
| POST | `/users/staff` | Admin | Create an IT staff account |
| POST | `/users/{user_id}/decision` | Admin | Approve or reject an account |
| GET | `/stats` | Staff | Dashboard summaries |

---

## Running 24/7 on a Windows PC

Closing a command window stops the server, and a Windows restart does too. To keep the system up:

1. **Start at boot, no window needed.** Use **Task Scheduler**: create a task with the trigger *At startup* (delay 1 minute so PostgreSQL is ready), set *Run whether user is logged on or not*, and choose your start script as the action.
   In the task's **Settings**, untick *Stop the task if it runs longer than...* (it would otherwise stop the server after 3 days), and set *If the task fails, restart every 1 minute*.
2. **Or run as a Windows service** with a tool such as NSSM, which restarts it automatically if it stops. Remember to put `SECRET_KEY`, `ALLOWED_ORIGINS` and the other settings in the service's environment.
3. **Keep the PC awake:** set Sleep to *Never*, set active hours for Windows updates, and ideally use a UPS.
4. **Test it:** restart the PC once and confirm the site comes back without anyone logging in.

---

## Backup and Restore

The database holds all tickets, comments, accounts and deletion logs, so back it up regularly. Run `pg_dump` on a schedule (for example daily with Task Scheduler) and keep copies on **another drive or computer**.

**Create a backup** (custom format):

```bash
pg_dump -U postgres -F c -f "helpdesk_backup.backup" Helpdesk
```

To run it without a password prompt, store the password in PostgreSQL's `pgpass.conf` file (Windows: `%APPDATA%\postgresql\pgpass.conf`, one line: `localhost:5432:*:postgres:YOUR-PASSWORD`).

**Restore into a new, empty database** (also the safe way to test a backup):

```bash
createdb -U postgres Helpdesk_test
pg_restore -U postgres -d Helpdesk_test "helpdesk_backup.backup"
```

**Restore over the live database** (replaces current data with the backup):
1. Stop the backend.
2. Take a fresh backup of the current state first.
3. Run:
   ```bash
   pg_restore -U postgres -d Helpdesk --clean --if-exists "helpdesk_backup.backup"
   ```
4. Start the backend.

Delete a test database with `dropdb -U postgres Helpdesk_test`. Double-check the name first, because this is permanent.

To clear only the deletion logs and restart their numbering:

```sql
TRUNCATE TABLE ticket_deletion_logs RESTART IDENTITY;
```

---

## Security Notes

- **Never commit secrets.** Keep database passwords, `ADMIN_PASSWORD` and `SECRET_KEY` out of the source code. Use environment variables or a `.env` file that is listed in `.gitignore`.
- Recommended `.gitignore` entries: `.env`, `*.db`, `*.sqlite3`, `*.backup`, `__pycache__/`, `node_modules/`, `frontend/dist/`, `.venv/`.
- Set a real `SECRET_KEY`. A known default key would let anyone forge login tokens.
- Change the first admin's password after the first login.
- Backup files contain staff emails and password hashes. Treat them as confidential.
- Keep the repository **private**. The system is intended for use on the company's internal network.
- Set `DISABLE_DOCS=1` and set `ALLOWED_ORIGINS` to your real site address on the production server.

---

## Troubleshooting

| Problem | What to check |
|---|---|
| New changes do not appear | Run `npm run build` (check it finishes without errors), make sure the web server serves the new `dist/`, then press Ctrl+F5. |
| Build fails with `error TS...` | The build runs a strict TypeScript check. Fix the reported file and line, then rebuild. |
| Browser shows a CORS error | Add the exact address you browse to into `ALLOWED_ORIGINS` and restart the backend. |
| Everyone gets signed out after a restart | `SECRET_KEY` changes on every start. Use a fixed value. |
| Backend stops at startup or cannot connect to the database | Check PostgreSQL is running and `DATABASE_URL` (user, password, port, database name) is correct. |
| Login says the account has no access | The account must be an approved IT Admin or IT Assistant. Employees do not sign in. |
| Priority is not saved / column missing | Restart the backend so the startup migration can add the `priority_level` column. |
| Scheduled backup does not run | Check the task's Last Run Result, run the script by hand, and make sure the task runs as the same Windows user that owns `pgpass.conf`. |

---

## Credits

**ITI Helpdesk** was developed by 4th Year Student Interns of the **Technological University of the Philippines – Manila**, Bachelor of Engineering Technology, Major in Computer Engineering Technology.

| Role | Name |
|---|---|
| Backend and Frontend Developer | Geo Kenzter Gutierrez |
| Quality Assurance (QA) | Dheejay De Guzman |
| Quality Assurance (QA) | Viggo Salvador |

Developed with dedication by the ITI HelpDesk Development Team.

Support hours: Mon–Fri, 8:00 AM – 6:00 PM

© 2026 ITI Helpdesk | All rights reserved
