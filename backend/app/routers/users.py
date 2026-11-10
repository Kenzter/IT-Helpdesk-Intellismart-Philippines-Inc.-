from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import STAFF_ROLES, hash_password, require_admin, require_staff
from ..config import company_email_error

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[schemas.UserOut])
def list_users(role: str | None = None, staff: bool = False, db: Session = Depends(get_db),
               me: models.User = Depends(require_staff)):
    """staff=true returns the people a ticket can be assigned to.
    The main admin sees admins and assistants; an IT assistant sees assistants only."""
    q = db.query(models.User)
    if staff:
        allowed = STAFF_ROLES if me.role == "ADMIN" else ("ASSISTANT",)
        q = q.filter(models.User.role.in_(allowed))
    elif role:
        q = q.filter(models.User.role == role.upper())
    return q.order_by(models.User.full_name).all()


# ---- IT staff accounts (main admin only) ------------------------------------

@router.get("/accounts", response_model=List[schemas.UserOut])
def list_staff_accounts(db: Session = Depends(get_db), _: models.User = Depends(require_admin)):
    """Admins and IT assistants. Old employee accounts are kept in the database but not listed."""
    return (db.query(models.User).filter(models.User.role.in_(STAFF_ROLES))
            .order_by(models.User.full_name).all())


@router.post("/staff", response_model=schemas.UserOut, status_code=201)
def create_staff(data: schemas.StaffCreate, db: Session = Depends(get_db),
                 _: models.User = Depends(require_admin)):
    name = " ".join(data.full_name.split())
    if len(name.split()) < 2:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please enter the full name: first name and surname.")
    email = data.email.lower()
    problem = company_email_error(email)
    if problem:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, problem)
    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "That email already has an account")
    user = models.User(email=email, full_name=name, hashed_password=hash_password(data.password),
                       role="ASSISTANT", department=data.department, account_status="APPROVED")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/decision", response_model=schemas.UserOut)
def decide_account(user_id: int, data: schemas.AccountDecision, db: Session = Depends(get_db),
                   admin: models.User = Depends(require_admin)):
    """APPROVED restores access, REJECTED removes it."""
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "Account not found")
    if user.id == admin.id or user.role == "ADMIN":
        raise HTTPException(400, "Admin accounts cannot be changed here")
    user.account_status = data.decision
    db.commit()
    db.refresh(user)
    return user
