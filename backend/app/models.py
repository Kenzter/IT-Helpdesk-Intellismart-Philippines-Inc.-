from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(10), nullable=False, default="USER")  # USER | ASSISTANT | ADMIN
    department = Column(String(50), nullable=True)
    # PENDING (waiting for admin) | APPROVED (can sign in) | REJECTED (cannot sign in)
    account_status = Column(String(10), nullable=False, default="APPROVED")
    created_at = Column(DateTime(timezone=True), default=utcnow)


class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(60), nullable=False)   # see CATEGORIES in schemas.py
    department = Column(String(50), nullable=True)  # see DEPARTMENTS in schemas.py
    status = Column(String(15), nullable=False, default="OPEN")
    # Employees no longer have accounts: their name is stored on the ticket itself.
    # reporter_id is only filled for older tickets that were created by a logged-in employee.
    requester_name = Column(String(255), nullable=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    # Last staff member who changed employee-submitted ticket information.
    last_edited_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    last_edited_at = Column(DateTime(timezone=True), nullable=True)

    reporter = relationship("User", foreign_keys=[reporter_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    last_edited_by = relationship("User", foreign_keys=[last_edited_by_id])
    comments = relationship("Comment", back_populates="ticket",
                            order_by="Comment.created_at", cascade="all, delete-orphan")


class TicketDeletionLog(Base):
    """Permanent snapshot of a ticket at the moment an admin deleted it.

    Deliberately has NO foreign keys (not to tickets, not to users): the audit row must
    survive the deletion of the ticket and any later change to the admin's account.
    """
    __tablename__ = "ticket_deletion_logs"
    id = Column(Integer, primary_key=True, index=True)
    original_ticket_id = Column(Integer, nullable=False, index=True)
    ticket_title = Column(String(255), nullable=False)
    ticket_description = Column(Text, nullable=False)
    ticket_category = Column(String(60), nullable=False)
    ticket_department = Column(String(50), nullable=True)
    ticket_status = Column(String(15), nullable=False)
    requester_name = Column(String(255), nullable=True)
    assigned_to_id = Column(Integer, nullable=True)
    assigned_to_name = Column(String(255), nullable=True)
    ticket_created_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by_id = Column(Integer, nullable=False)
    deleted_by_name = Column(String(255), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, index=True)


class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    ticket = relationship("Ticket", back_populates="comments")
    user = relationship("User")
