from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.auth import hash_password, verify_password
from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8)


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserResponse)
def update_me(
    data: UserProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updates = data.model_dump(exclude_unset=True)

    if "email" in updates and updates["email"] != user.email:
        existing = (
            db.query(User)
            .filter(User.email == updates["email"], User.id != user.id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        user.email = updates["email"]

    if "full_name" in updates:
        user.full_name = updates["full_name"]

    db.commit()
    db.refresh(user)
    return user


@router.post("/me/password")
def change_password(
    data: PasswordChangeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if data.current_password == data.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from the current password",
        )

    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"status": "updated"}
