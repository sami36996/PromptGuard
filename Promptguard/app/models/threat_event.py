"""Threat event - high-severity detections."""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class ThreatEvent(Base):
    __tablename__ = "threat_events"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="SET NULL"), nullable=True)
    guard_log_id = Column(Integer, ForeignKey("guard_logs.id", ondelete="SET NULL"), nullable=True)
    
    # Threat details
    threat_type = Column(String(50), nullable=False)  # prompt_injection, xss, etc.
    severity = Column(String(20), nullable=False)  # low, medium, high, critical
    confidence = Column(Float, nullable=False)
    
    # Content
    matched_text = Column(Text, nullable=True)
    prompt_snippet = Column(Text, nullable=True)
    
    # Status
    status = Column(String(20), default="open")  # open, resolved, false_positive
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
        # Relationships
    company = relationship(
        "Company",
        back_populates="threat_events",
    )

    agent = relationship(
        "Agent",
        back_populates="threat_events",
    )