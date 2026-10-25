from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class CompanySettings(Base):
    __tablename__ = "company_settings"

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        primary_key=True,
    )

    email = Column(String, nullable=True)
    email_alerts = Column(Boolean, default=True, nullable=False)
    high_risk_alerts = Column(Boolean, default=True, nullable=False)
    quarantine_alerts = Column(Boolean, default=True, nullable=False)

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    company = relationship("Company")
