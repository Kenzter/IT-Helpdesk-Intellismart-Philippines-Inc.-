import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..config import PUBLIC_DUPLICATE_SECONDS, PUBLIC_RATE_LIMIT, PUBLIC_RATE_WINDOW_SECONDS

router = APIRouter(prefix="/public", tags=["public"])

_hits: dict[str, deque] = defaultdict(deque)
_lock = threading.Lock()


def _check_rate(ip: str) -> None:
    """Simple per-connection limit, kept in memory (resets when the backend restarts)."""
    now = time.monotonic()
    with _lock:
        q = _hits[ip]
        while q and now - q[0] > PUBLIC_RATE_WINDOW_SECONDS:
            q.popleft()
        if len(q) >= PUBLIC_RATE_LIMIT:
            raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS,
                                "Too many tickets were sent from your connection. Please wait a few minutes and try again.")
        q.append(now)


@router.post("/tickets", response_model=schemas.PublicTicketOut, status_code=201)
def submit_ticket(data: schemas.PublicTicketCreate, request: Request, response: Response,
                  db: Session = Depends(get_db)):
    """Employees submit a ticket without an account. Creates a normal ticket in the existing table."""
    if data.website:  # a real person never sees or fills this hidden field
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Could not submit this ticket.")
    _check_rate(request.client.host if request.client else "unknown")

    name = " ".join(data.requester_name.split())
    title = " ".join(data.title.split())
    description = data.description.strip()
    if len(name.split()) < 2:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please enter your full name: first name and surname.")
    if not title or not description:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Subject and description cannot be empty.")

    # Double-click / repeated submit: return the ticket that was just created instead of making a second one.
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=PUBLIC_DUPLICATE_SECONDS)
    same = db.query(models.Ticket).filter(
        models.Ticket.requester_name == name, models.Ticket.title == title,
        models.Ticket.description == description, models.Ticket.created_at >= cutoff,
    ).first()
    if same:
        response.status_code = status.HTTP_200_OK
        return same

    ticket = models.Ticket(requester_name=name, title=title, description=description,
                           category=data.category, department=data.department,
                           status="OPEN", reporter_id=None)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket
