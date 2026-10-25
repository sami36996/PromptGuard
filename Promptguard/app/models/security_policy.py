from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base


class SecurityPolicy(Base):
    __tablename__ = "security_policy"

    id = Column(Integer, primary_key=True)

    name = Column(String, default="Default Policy")

    review_threshold = Column(Integer, default=30)
    
    block_threshold = Column(Integer, default=70)

    quarantine_threshold = Column(Integer, default=30)

    max_chain_risk = Column(Integer, default=200)

    auto_quarantine = Column(Boolean, default=True)