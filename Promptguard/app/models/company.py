from datetime import datetime


from sqlalchemy.orm import relationship

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
)

from app.core.database import Base



class Company(Base):

    __tablename__ = "companies"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    slug = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    guard_logs = relationship(
        "GuardLog",
        back_populates="company",
        cascade="all, delete-orphan",
    )

    threat_events = relationship(
        "ThreatEvent",
        back_populates="company",
        cascade="all, delete-orphan",
    )
    api_keys = relationship(
    "AgentAPIKey",
    back_populates="company",
    cascade="all, delete-orphan",
    )
    memberships = relationship(
    "Membership",
    back_populates="company",
    cascade="all, delete-orphan",
    )