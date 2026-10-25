from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class CompanyPolicy(Base):
    __tablename__ = "company_policies"

    id = Column(Integer, primary_key=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        unique=True,
        nullable=False,
        index=True,
    )

    max_risk = Column(Integer, default=70, nullable=False)
    max_chain_risk = Column(Integer, default=70, nullable=False)
    auto_block = Column(Boolean, default=True, nullable=False)
    allowed_models = Column(JSON, default=list, nullable=False)
    blocked_keywords = Column(JSON, default=list, nullable=False)

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    company = relationship("Company")
