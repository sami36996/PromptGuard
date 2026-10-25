from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class AgentAPIKey(Base):

    __tablename__ = "agent_api_keys"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False,
        index=True,
    )

    agent_id = Column(
        String,
        ForeignKey("agents.agent_id"),
        nullable=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    key_hash = Column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    key_prefix = Column(
        String,
        nullable=False,
    )

    permissions = Column(
        JSON,
        default=list,
    )

    rate_limit = Column(
        Integer,
        default=100,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    last_used_at = Column(
        DateTime,
        nullable=True,
    )

    expires_at = Column(
        DateTime,
        nullable=True,
    )

    company = relationship(
        "Company",
        back_populates="api_keys",
    )
