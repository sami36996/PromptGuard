from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Text,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from datetime import datetime

from app.core.database import Base
from sqlalchemy import Enum as SQLEnum

class Agent(Base):

    __tablename__ = "agents"

    id = Column(
        Integer,
        primary_key=True
    )

    agent_id = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False,
        index=True
    )

    agent_name = Column(
        String,
        nullable=False
    )

    agent_type = Column(
        String,
        nullable=False
    )

    organization = Column(
        String,
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )

    trust_score = Column(
        Float,
        default=100
    )

    total_messages = Column(
        Integer,
        default=0
    )

    blocked_messages = Column(
        Integer,
        default=0
    )

    last_seen = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
    guard_logs = relationship(
        "GuardLog",
        back_populates="agent",
    )

    threat_events = relationship(
        "ThreatEvent",
        back_populates="agent",
    )
    status = Column(
    SQLEnum(
        "active",
        "suspended",
        "quarantined",
        "revoked",
        name="agent_status"
    ),
    nullable=False,
    default="active",
    server_default="active",
)