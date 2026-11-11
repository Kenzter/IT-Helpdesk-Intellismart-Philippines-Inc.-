from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from .. import models, schemas
from ..auth import STAFF_ROLES, require_admin, require_staff

router = APIRouter(prefix="/tickets", tags=["tickets"])


def _filtered(db: Session, status_: Optional[str], department: Optional[str],
              category: Optional[str], q: Optional[str]):
    query = db.query(models.Ticket).options(
        joinedload(models.Ticket.reporter), joinedload(models.Ticket.assigned_to),
        joinedload(models.Ticket.last_edited_by))
    if status_:
        query = query.filter(models.Ticket.status == status_.upper())
    if department:
        query = query.filter(models.Ticket.department == department)
    if category:
        query = query.filter(models.Ticket.category == category)
    if q:
        like = f"%{q.strip()}%"
        clauses = [models.Ticket.title.ilike(like), models.Ticket.description.ilike(like),
                   models.Ticket.requester_name.ilike(like)]
        if q.strip().isdigit():
            clauses.append(models.Ticket.id == int(q.strip()))
        query = query.filter(or_(*clauses))
    return query


@router.get("", response_model=List[schemas.TicketOut])
def list_all_tickets(status: Optional[str] = None, department: Optional[str] = None,
                     category: Optional[str] = None, q: Optional[str] = None,
                     assigned_to_id: Optional[int] = None,
                     db: Session = Depends(get_db), _: models.User = Depends(require_staff)):
    query = _filtered(db, status, department, category, q)
    if assigned_to_id:
        query = query.filter(models.Ticket.assigned_to_id == assigned_to_id)
    return query.order_by(models.Ticket.created_at.desc()).all()


@router.get("/assigned-count")
def my_assigned_count(db: Session = Depends(get_db), user: models.User = Depends(require_staff)):
    """Tickets assigned to me that are still being worked on (Open or In Progress)."""
    n = db.query(models.Ticket).filter(
        models.Ticket.assigned_to_id == user.id,
        models.Ticket.status.in_(["OPEN", "IN_PROGRESS"]),
    ).count()
    return {"count": n}


# Must stay ABOVE "/{ticket_id}" so "deletion-logs" is not parsed as a ticket id.
@router.get("/deletion-logs", response_model=List[schemas.TicketDeletionLogOut])
def list_deletion_logs(db: Session = Depends(get_db), _: models.User = Depends(require_admin)):
    """Permanent history of deleted tickets (main admin only), newest deletion first."""
    return db.query(models.TicketDeletionLog).order_by(
        models.TicketDeletionLog.deleted_at.desc(), models.TicketDeletionLog.id.desc()).all()


def _get_ticket(ticket_id: int, db: Session) -> models.Ticket:
    ticket = db.get(models.Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    return ticket


@router.get("/{ticket_id}", response_model=schemas.TicketDetail)
def get_ticket(ticket_id: int, db: Session = Depends(get_db), _: models.User = Depends(require_staff)):
    return db.query(models.Ticket).options(
        joinedload(models.Ticket.reporter),
        joinedload(models.Ticket.assigned_to),
        joinedload(models.Ticket.last_edited_by),
    ).filter(models.Ticket.id == ticket_id).first() or _get_ticket(ticket_id, db)


@router.patch("/{ticket_id}", response_model=schemas.TicketOut)
def update_ticket(ticket_id: int, data: schemas.TicketUpdate, db: Session = Depends(get_db),
                  actor: models.User = Depends(require_staff)):
    ticket = _get_ticket(ticket_id, db)
    changes = data.model_dump(exclude_unset=True)
    # Record an audit stamp only when ticket information actually changes.
    info_fields = {"title", "description", "category", "department"}
    info_changed = any(field in changes and getattr(ticket, field) != changes[field]
                       for field in info_fields)
    if info_changed:
        ticket.last_edited_by_id = actor.id
        ticket.last_edited_at = models.utcnow()
    if "assigned_to_id" in changes and changes["assigned_to_id"] is not None:
        tech = db.get(models.User, changes["assigned_to_id"])
        if not tech or tech.role not in STAFF_ROLES:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Assignee must be an IT agent")
        if tech.role == "ADMIN" and actor.role != "ADMIN":
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the main admin can assign tickets to the IT admin")
    for field, value in changes.items():
        if field == "status" and value is None:
            continue
        setattr(ticket, field, value)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/{ticket_id}/comments", response_model=schemas.CommentOut, status_code=201)
def add_comment(ticket_id: int, data: schemas.CommentCreate, db: Session = Depends(get_db),
                user: models.User = Depends(require_staff)):
    ticket = _get_ticket(ticket_id, db)
    comment = models.Comment(ticket_id=ticket.id, user_id=user.id,
                             content=data.content, is_internal=data.is_internal)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def _delete_if_resolved(db: Session, ticket: models.Ticket, admin: models.User) -> None:
    """Stage an audit snapshot AND the deletion. The caller commits both in one transaction."""
    db.add(models.TicketDeletionLog(
        original_ticket_id=ticket.id,
        ticket_title=ticket.title,
        ticket_description=ticket.description,
        ticket_category=ticket.category,
        ticket_department=ticket.department,
        ticket_status=ticket.status,
        requester_name=ticket.requester_name or (ticket.reporter.full_name if ticket.reporter else None),
        assigned_to_id=ticket.assigned_to_id,
        assigned_to_name=ticket.assigned_to.full_name if ticket.assigned_to else None,
        ticket_created_at=ticket.created_at,
        deleted_by_id=admin.id,
        deleted_by_name=admin.full_name,
        deleted_at=models.utcnow(),
    ))
    db.delete(ticket)  # comments are deleted with it


def _commit_or_rollback(db: Session) -> None:
    """Audit rows and deletions are saved together or not at all."""
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR,
                            "Could not delete the ticket(s). Nothing was changed.")


@router.post("/bulk-delete")
def bulk_delete_resolved(data: schemas.BulkDelete, db: Session = Depends(get_db),
                         admin: models.User = Depends(require_admin)):
    """Permanently delete the chosen tickets, but only ones that are Resolved."""
    ids = set(data.ids)  # duplicates in the request must not create duplicate audit rows
    tickets = db.query(models.Ticket).filter(models.Ticket.id.in_(ids)).all()
    deleted = 0
    for t in tickets:
        if t.status == "RESOLVED":
            _delete_if_resolved(db, t, admin)
            deleted += 1
    _commit_or_rollback(db)
    return {"deleted": deleted, "skipped": len(ids) - deleted}


@router.delete("/{ticket_id}", status_code=204)
def delete_resolved_ticket(ticket_id: int, db: Session = Depends(get_db),
                           admin: models.User = Depends(require_admin)):
    ticket = db.get(models.Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket not found")
    if ticket.status != "RESOLVED":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only Resolved tickets can be deleted")
    _delete_if_resolved(db, ticket, admin)
    _commit_or_rollback(db)
