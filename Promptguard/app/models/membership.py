from datetime import datetime
from enum import Enum
from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)

from app.core.database import Base


class MembershipRole(str, Enum):

    OWNER = "owner"
    ADMIN = "admin"
    DEVELOPER = "developer"
    VIEWER = "viewer"


class Membership(Base):

    __tablename__ = "memberships"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False,
        index=True
    )

    role = Column(
        String,
        default=MembershipRole.VIEWER.value,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "company_id",
            name="unique_user_company_membership"
        ),
    )
    user = relationship(
    "User",
    back_populates="memberships"
    )

    company = relationship(
    "Company",
    back_populates="memberships"
    )