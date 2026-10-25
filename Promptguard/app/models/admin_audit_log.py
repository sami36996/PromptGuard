from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    JSON,
)

from app.core.database import Base


class AdminAuditLog(Base):

    __tablename__ = "admin_audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    admin_id = Column(
        Integer,
        nullable=True,
    )

    action = Column(
        String,
        nullable=False,
    )

    resource_type = Column(
        String,
        nullable=False,
    )

    resource_id = Column(
        String,
        nullable=True,
    )

    reason = Column(
        Text,
        nullable=True,
    )

    extra_data = Column(
        JSON,
        nullable=True,
    )

    ip_address = Column(
        String,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )