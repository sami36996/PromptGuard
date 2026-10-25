from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String,
        nullable=False
    )

    full_name = Column(
        String,
        nullable=True
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    is_platform_admin = Column(
        Boolean,
        default=False,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    last_login = Column(
        DateTime,
        nullable=True
    )
    memberships = relationship(
        "Membership",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    @property
    def company_id(self):
        if not self.memberships:
            return None

        return self.memberships[0].company_id
    @property
    def is_super_admin(self):
        return self.is_platform_admin