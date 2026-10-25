"""Auth service."""

from datetime import timedelta

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.membership import Membership, MembershipRole
from app.core.security import verify_password, create_access_token
from app.services.user_service import create_user, add_user_to_company
from app.services.company_service import create_company
from app.schemas.auth import RegisterRequest
from app.schemas.company import CompanyCreate


def authenticate_user(
    db: Session,
    email: str,
    password: str
) -> User | None:

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def login_user(
    db: Session,
    email: str,
    password: str
) -> dict | None:

    user = authenticate_user(db, email, password)

    if not user:
        return None

    # Get the user's first company membership
    membership = (
        db.query(Membership)
        .filter(Membership.user_id == user.id)
        .first()
    )

    primary_company = membership.company if membership else None

    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "is_super_admin": user.is_platform_admin,
    }

    if primary_company:
        token_data["company_id"] = primary_company.id

    access_token = create_access_token(
        token_data,
        expires_delta=timedelta(days=1)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 86400,
        "user": user,
        "company": primary_company,
    }


def register_user(
    db: Session,
    data: RegisterRequest
) -> dict:

    # Create user
    user = create_user(db, data)

    # Create company if provided
    company = None

    if data.company_name:

        company_data = CompanyCreate(
            name=data.company_name,
            slug=data.company_name
                .lower()
                .replace(" ", "-")[:50]
        )

        company = create_company(
            db,
            company_data
        )

        add_user_to_company(
            db,
            user.id,
            company.id,
            MembershipRole.OWNER
        )

    # Generate token
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "is_super_admin": user.is_platform_admin,
    }

    if company:
        token_data["company_id"] = company.id

    access_token = create_access_token(
        token_data,
        expires_delta=timedelta(days=1)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 86400,
        "user": user,
        "company": company,
    }