"""User service."""
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.schemas.auth import RegisterRequest
from app.models.user import User
from app.models.membership import Membership, MembershipRole
from app.core.security import hash_password
from app.schemas.user import UserCreate


def create_user(db: Session, data: RegisterRequest) -> User:
    existing_user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def get_user(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def add_user_to_company(
    db: Session,
    user_id: int,
    company_id: int,
    role: str = MembershipRole.DEVELOPER.value,
) -> Membership:
    membership = Membership(
        user_id=user_id,
        company_id=company_id,
        role=role,
    )

    db.add(membership)
    db.commit()
    db.refresh(membership)

    return membership


def get_user_companies(db: Session, user_id: int) -> list:
    return (
        db.query(Membership)
        .filter(Membership.user_id == user_id)
        .all()
    )