from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import STAFF_ROLES, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


def _token_response(user: models.User) -> schemas.Token:
    return schemas.Token(access_token=create_access_token(user), role=user.role,
                         user=schemas.UserOut.model_validate(user))


def _check_can_sign_in(user: models.User) -> None:
    # Only IT admins and IT assistants sign in. Employees submit tickets on the public page.
    if user.role not in STAFF_ROLES:
        raise HTTPException(status.HTTP_403_FORBIDDEN,
                            "Employees do not need an account. Please use the ticket submission page.")
    if user.account_status != "APPROVED":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Your access has been removed. Please contact the IT admin.")


@router.post("/login", response_model=schemas.Token)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    _check_can_sign_in(user)
    return _token_response(user)


@router.post("/form-login", response_model=schemas.Token, include_in_schema=False)
def form_login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Lets the Swagger 'Authorize' button work."""
    user = db.query(models.User).filter(models.User.email == form.username.lower()).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    _check_can_sign_in(user)
    return _token_response(user)


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user
