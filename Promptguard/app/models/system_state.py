from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
)

from datetime import datetime

from app.core.database import Base


class SystemState(Base):

    __tablename__ = "system_state"

    id = Column(
        Integer,
        primary_key=True,
    )

    mode = Column(
        String,
        nullable=False,
        default="normal",
        server_default="normal",
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )