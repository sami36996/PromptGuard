"""Guard log - every /guard API call logged."""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class GuardLog(Base):
    __tablename__ = "guard_logs"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="SET NULL"), nullable=True, index=True)
    api_key_id = Column(Integer, ForeignKey("agent_api_keys.id", ondelete="SET NULL"), nullable=True)
    
    # Request
    prompt = Column(Text, nullable=False)
    prompt_length = Column(Integer, nullable=True)
    
    # Result
    action = Column(String(20), nullable=False)  # allow, block, sanitize, flag
    score = Column(Float, nullable=False)
    detections = Column(JSON, default=list)  # [{type, confidence, matched_text}]
    
    # Performance
    latency_ms = Column(Integer, nullable=True)
    
    # Context
    source_ip = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    company = relationship("Company", back_populates="guard_logs")
    agent = relationship("Agent", back_populates="guard_logs")