from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base


class AgentTrust(Base):
    __tablename__ = "agent_trust"

    id = Column(Integer, primary_key=True, index=True)

    agent_id = Column(String, unique=True, index=True)

    trust_score = Column(Float, default=100.0)