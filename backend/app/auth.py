import os
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from .database import get_db
from . import models

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRE_MINUTES", "480"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/form-login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user: models.User) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user.id), "role": user.role, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    creds_error = HTTPException(status.HTTP_401_UNAUTHORIZED, "Could not validate credentials",
                                headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise creds_error
    user = db.get(models.User, user_id)
    if not user or user.account_status != "APPROVED" or user.role not in STAFF_ROLES:
        raise creds_error
    return user


STAFF_ROLES = ("ADMIN", "ASSISTANT")  # ADMIN = main admin, ASSISTANT = IT assistant (no deleting)


def require_staff(user: models.User = Depends(get_current_user)) -> models.User:
    """Main admins and IT assistants: dashboard, all tickets, assign, resolve, comment."""
    if user.role not in STAFF_ROLES:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "IT staff access required")
    return user


def require_admin(user: models.User = Depends(get_current_user)) -> models.User:
    """Main admins only (used for deleting tickets)."""
    if user.role != "ADMIN":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the main admin can do this")
    return user
