from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.core.database import Base


class AgentEdge(Base):
    __tablename__ = "agent_edges"

    id = Column(Integer, primary_key=True, index=True)

    chain_id = Column(String, index=True)

    hop_index = Column(Integer, default=1)

    from_agent = Column(String, index=True)
    to_agent = Column(String, index=True)

    score = Column(Float)
    chain_risk = Column(Float)

    decision = Column(String, nullable=True)

    message_type = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)